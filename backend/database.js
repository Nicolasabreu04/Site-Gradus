const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || "gradus",
  password: process.env.DB_PASSWORD || "gradus123",
  database: process.env.DB_NAME || "gradus_db",
});

module.exports = pool;
