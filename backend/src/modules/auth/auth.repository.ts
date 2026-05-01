import { query } from "../../shared/database/db";
import { RefreshTokenDB } from "./auth.types";

/**
 * Repository class for authentication-related database operations. Provides methods to
 * get users by email or ID, create new users, manage refresh tokens, and revoke tokens.
 */
export class AuthRepository {
  /**
   * Creates a new refresh token in the database.
   * @param userId - The ID of the user associated with the refresh token.
   * @param tokenHash - The hashed value of the refresh token.
   * @param expiresAt - The expiration date of the refresh token.
   * @returns A promise that resolves when the token is created.
   */
  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, tokenHash, expiresAt],
    );
  }

  /**
   * Retrieves a refresh token from the database by its hashed value.
   * @param tokenHash - The hashed value of the refresh token to retrieve.
   * @returns A promise resolving to the refresh token or null if not found.
   */
  async getRefreshToken(tokenHash: string): Promise<RefreshTokenDB | null> {
    const result = await query(
      "SELECT id, user_id, token_hash, expires_at, revoked FROM refresh_tokens " +
        "WHERE token_hash = $1",
      [tokenHash],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Revokes a refresh token by its hashed value.
   * @param tokenHash - The hashed value of the refresh token to revoke.
   * @returns A promise that resolves when the token is revoked.
   */
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await query(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1",
      [tokenHash],
    );
  }

  /**
   * Revokes all refresh tokens associated with a specific user ID.
   * @param userId - The ID of the user whose refresh tokens should be revoked.
   * @returns A promise that resolves when all tokens are revoked.
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await query("UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1", [
      userId,
    ]);
  }
}
