import pool from "../config/db";

const createSessionTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      revoked BOOLEAN DEFAULT FALSE
    )
  `;

  try {
    await pool.query(queryText);
    console.log("Sessions table created if not exists");
  } catch (err) {
    console.error("Error creating sessions table:", err);
    throw err;
  }
};

export default createSessionTable;