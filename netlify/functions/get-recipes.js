const { Client } = require("pg");

exports.handler = async () => {
  try {
    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
    });
    await client.connect();

    const res = await client.query(`
      SELECT id, title, description, image_url, ingredients, procedure, author, created_at
      FROM recipes
      ORDER BY created_at DESC
    `);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(res.rows),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
};
