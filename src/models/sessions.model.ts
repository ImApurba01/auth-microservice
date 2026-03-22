import pool from "../config/db.ts";

export const createSessionService = async (
  userId: number,
  refreshTokenHash: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
) => {
  const result = await pool.query(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, refreshTokenHash, expiresAt, ipAddress || null, userAgent || null]
  );
  return result.rows[0];
};

// Fetch a session by token
export const fetchSessionService = async (refreshTokenHash: string) => {
  const result = await pool.query(
    "SELECT * FROM sessions WHERE refresh_token_hash = $1",
    [refreshTokenHash]
  );
  return result.rows[0] || null;
};

// Logout || update session
export const updateSessionService = async (session: any) => {
  const result = await pool.query(
    `UPDATE sessions
     SET refresh_token_hash = $1,
         revoked = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [session.refresh_token_hash, session.revoked, session.id]
  );

  return result.rows[0];
};


