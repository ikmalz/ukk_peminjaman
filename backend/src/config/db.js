const { Pool } = require("pg");

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

db.connect()
  .then(() => {
    console.log("Database terhubung ke PostgreSQL");
  })
  .catch((err) => {
    console.error("Database gagal terhubung");
    console.error(err);
  });

module.exports = db;