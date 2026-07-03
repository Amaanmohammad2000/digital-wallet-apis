require('dotenv').config();

const schema = process.env.DB_SCHEMA || 'wallet';

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  hooks: {
    afterConnect: async (connection) => {
      await connection.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await connection.query(`SET search_path TO "${schema}", public`);
    },
  },
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
