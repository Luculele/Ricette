// netlify/functions/get-recipes.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL, // la stringa del tuo DB Neon
  ssl: { rejectUnauthorized: false }, // necessario per Neon
});

exports.handler = async function (event, context) {
  try {
    const res = await pool.query(
      "SELECT id, title, description, ingredients, procedure, created_at FROM recipes ORDER BY created_at DESC"
    );
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(res.rows),
    };
  } catch (err) {
    console.error("DB error", err);
    return { statusCode: 500, body: "Server error" };
  }
};
