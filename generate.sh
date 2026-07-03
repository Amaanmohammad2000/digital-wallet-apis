#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env"

PORT=5000
NODE_ENV=development

DB_NAME=digital_wallet
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_SCHEMA=wallet

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_EXPIRY=1d
JWT_ISSUER=digital-wallet-apis

DEFAULT_CURRENCY=INR
DEFAULT_DAILY_LIMIT=500000

FX_PROVIDER_URL=https://open.er-api.com/v6/latest
FX_REFRESH_CRON='0 */6 * * *'
FX_REFRESH_COOLDOWN_SECONDS=300

if [ -f "$ENV_FILE" ] && [ "${1:-}" != "--force" ]; then
  echo "$ENV_FILE already exists. Re-run with --force to overwrite it."
  exit 1
fi

if command -v openssl >/dev/null 2>&1; then
  JWT_SECRET=$(openssl rand -hex 32)
else
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
fi

cat > "$ENV_FILE" <<EOF
# Server
PORT=$PORT
NODE_ENV=$NODE_ENV

# Database
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_SCHEMA=$DB_SCHEMA

# Redis
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=$JWT_EXPIRY
JWT_ISSUER=$JWT_ISSUER

# Business rules
DEFAULT_CURRENCY=$DEFAULT_CURRENCY
DEFAULT_DAILY_LIMIT=$DEFAULT_DAILY_LIMIT

# Live FX rates (open.er-api.com — free, no API key required)
FX_PROVIDER_URL=$FX_PROVIDER_URL
FX_REFRESH_CRON=$FX_REFRESH_CRON
FX_REFRESH_COOLDOWN_SECONDS=$FX_REFRESH_COOLDOWN_SECONDS
EOF

echo "$ENV_FILE created with a freshly generated JWT_SECRET."
