# Digital Wallet API

A mini digital wallet system with JWT auth, multi-currency support, fraud detection, and rate limiting.
Built for the CodeGama Node.js Developer assignment.

## Stack
Node.js, Express, PostgreSQL, Sequelize, Redis, JWT (jsonwebtoken), bcrypt, Zod

## Design notes

**Database schema.** All tables live in a dedicated `wallet` Postgres schema (configurable via `DB_SCHEMA`), not the default `public` schema. On every new connection, an `afterConnect` hook in `database/config/config.js` runs `CREATE SCHEMA IF NOT EXISTS "wallet"` and then `SET search_path TO "wallet", public`. Both the app models and the raw `queryInterface` calls used by migrations/seeders don't reference a schema explicitly, so this makes unqualified table names resolve into `wallet` automatically. Even `SequelizeMeta`, the CLI's own migration-tracking table, ends up in `wallet` instead of polluting `public`.

**Base currency.** Wallet balances are always stored in INR. Amounts entered in other currencies get converted to INR at write time and converted back only for display, so rounding errors don't compound across repeated conversions.

**Exchange rates.** The `exchange_rate` table works as a live-refreshed cache rather than a static seed. `fx-refresh-service` fetches current rates from [open.er-api.com](https://www.exchangerate-api.com/docs/free) (free tier, no API key) right when the server boots, and again on a cron schedule (`FX_REFRESH_CRON`, 6 hours by default) using `node-cron`. Rates get upserted through `fx-service.setRate`. On the read side, `fx-service.getRate` checks Redis first (TTL `FX_CACHE_TTL_SECONDS`) and falls back to Postgres on a miss. If the provider is down, the refresh just logs a warning and keeps serving whatever rates it already has, so a flaky third party never breaks a transfer. The seed file under `database/seed` inserts one static snapshot too, purely so the API has *something* to convert against before the first live refresh finishes.

**Refresh cooldown.** The boot-time refresh grabs a Redis lock (`SET ... EX FX_REFRESH_COOLDOWN_SECONDS NX`, 5 minutes by default) before calling the live API. That's mostly for local dev: `nodemon` restarting on every file save would otherwise fire a fresh API call on each restart. Whoever wins the lock does the refresh; everyone else within that window just skips it and logs why. If Redis itself is unreachable the lock check is skipped and the refresh goes ahead anyway, since a broken cache shouldn't block a legitimate refresh.

**Concurrency.** Every balance-changing call (add funds, withdraw, transfer) runs inside a Sequelize transaction and takes a row lock (`SELECT ... FOR UPDATE`) on the wallet(s) it touches. Transfers lock both wallets in a consistent, sorted order rather than sender-then-recipient, which is what avoids a deadlock when two transfers happen between the same pair of users at once.

**Idempotency.** Every wallet-mutating request needs a client-supplied `referenceId` (a UUID). If that same id shows up again, the original transaction gets returned instead of processing it a second time, which makes retries after a timeout safe.

**Fraud detection.** Daily spend totals and recent-transaction velocity are tracked in Redis rather than Postgres, so the checks stay cheap on every write. Rather than blocking outright, three or more high-value transactions inside a five-minute window just get marked `flagged` on the transaction record, so one false positive doesn't lock a legitimate user out.

**Rate limiting.** A fixed-window Redis counter (`INCR` + `EXPIRE`) backs two separate limiters: one per user on the money-moving routes (add-funds, withdraw, transfer), and one per IP on register/login, since those happen before there's a user to key off of.

## Setup

```bash
bash generate.sh
# creates .env with a freshly generated JWT_SECRET and sensible local defaults
# (edit .env afterwards if your local DB/Redis credentials differ)

npm install
npm run migrate
npm run seed
npm run dev
```

Or with Docker:
```bash
bash generate.sh
docker compose up
```
The `app` service overrides `DB_HOST`/`REDIS_HOST` to `db`/`redis` so it can reach the other containers by their compose service name. The rest of `.env` is used as-is.

> On Windows, if the server fails to start with `EACCES: permission denied` on `PORT`, don't assume something else grabbed the port. Check `netsh interface ipv4 show excludedportrange protocol=tcp` first: the port might just fall inside a Hyper-V/WSL2 dynamic exclusion range, in which case picking a different `PORT` is the fix.

A ready-to-import Postman collection is at `postman/Digital-Wallet-API.postman_collection.json`. It covers every route below and auto-saves the JWT into a collection variable after register/login.

## API Reference

Base URL: `/api/v1`

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register a new user + auto-create wallet |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/profile` | JWT | Get authenticated user + wallet summary |

**Register**
```json
POST /api/v1/auth/register
{
  "name": "Amaan",
  "email": "amaan@example.com",
  "phoneNumber": "+919876543210",
  "password": "SecurePass123!",
  "defaultCurrency": "INR"
}
```
`phoneNumber` must be in E.164 format (`+` followed by country code and number) and is unique per account, since wallets are primarily accessed from mobile.

**Login**
```json
POST /api/v1/auth/login
{
  "phoneNumber": "+919876543210",
  "password": "SecurePass123!"
}
```
Login is by `phoneNumber`, not email. Email is still collected at registration and returned in profile responses, but it isn't a valid login credential.

### Wallet
All wallet routes require `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| GET | `/wallet/balance?currency=USD` | Get balance (optionally converted to a display currency) |
| GET | `/wallet/transactions?page=1&perPage=10&type=credit` | Paginated transaction history |
| POST | `/wallet/add-funds` | Add funds to own wallet |
| POST | `/wallet/withdraw` | Withdraw funds from own wallet |
| POST | `/wallet/transfer` | Transfer funds to another user's wallet |

**Add funds / Withdraw**
```json
{
  "amount": 1000,
  "currency": "INR",
  "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Transfer**
```json
{
  "toPhoneNumber": "+919876500000",
  "amount": 500,
  "currency": "INR",
  "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa7"
}
```
Recipients are looked up by phone number, same as login, matching how wallets are actually used day to day.

**Transaction history entry**
```json
{
  "id": "3aab689c-1c6c-42b7-ac02-0d05dbb58e71",
  "type": "transfer_out",
  "amount": 300,
  "currency": "INR",
  "status": "success",
  "createdAt": "2026-07-03T19:50:00.086Z",
  "counterparty": { "name": "Priya", "phoneNumber": "+919876500000" }
}
```
`counterparty` resolves the other side of a `transfer_in`/`transfer_out` entry to that user's name and phone number. For `credit` (add-funds) and `withdrawal` entries, which don't involve another user, it's `null`.

`referenceId` must be a client-generated UUID, unique per logical operation. Reuse the same value on retry to stay idempotent.

## Response shape

Success:
```json
{ "status": 200, "success": true, "message": "...", "data": { ... } }
```

Error:
```json
{ "status": 400, "success": false, "message": "..." }
```
