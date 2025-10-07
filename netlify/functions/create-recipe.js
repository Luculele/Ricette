// netlify/functions/create-recipe.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const { title, description, ingredients, procedure } = data;

    if (!title || !ingredients) {
      return { statusCode: 400, body: "Missing title or ingredients" };
    }

    const query = `
      INSERT INTO recipes (title, description, ingredients, procedure)
      VALUES ($1, $2, $3::jsonb, $4)
      RETURNING id, title, created_at;
    `;
    const values = [
      title,
      description || null,
      JSON.stringify(ingredients),
      procedure || null,
    ];
    const res = await pool.query(query, values);

    return { statusCode: 201, body: JSON.stringify(res.rows[0]) };
  } catch (err) {
    console.error("create-recipe error", err);
    return { statusCode: 500, body: "Server error" };
  }
};
