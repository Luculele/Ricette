const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const { title, description, image_url, ingredients, procedure, author } =
      data;

    if (!title || !Array.isArray(ingredients) || ingredients.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Dati mancanti" }),
      };
    }

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
    });
    await client.connect();

    await client.query(
      `INSERT INTO recipes (title, description, image_url, ingredients, procedure, author)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        title,
        description || "",
        image_url || "",
        JSON.stringify(ingredients),
        procedure || "",
        author || "",
      ]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
};
