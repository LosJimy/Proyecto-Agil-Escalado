import { Client, Pool } from "pg";
import { OtpCodeDB, RefreshTokenDB, UserDB } from "./auth.types";

/**
 * Repository class for authentication-related database operations. Provides methods to
 * get users by email or ID, create new users, manage refresh tokens, and revoke tokens.
 */
export class AuthRepository {
  constructor(private readonly query: Client | Pool) {}

  /**
   * Gets a user by their email address.
   * @param email - The email address of the user to retrieve.
   * @returns A promise resolving to the user or null if not found.
   */
  async getUserByEmail(email: string): Promise<UserDB | null> {
    const result = await this.query.query(
      "SELECT id, email, password_hash, is_active FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Gets a user by their ID.
   * @param id - The ID of the user to retrieve.
   * @returns A promise resolving to the user or null if not found.
   */
  async getUserById(id: string): Promise<UserDB | null> {
    const result = await this.query.query(
      "SELECT id, email, password_hash, is_active FROM users WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Creates a new user in the database.
   * @param email - The email address of the new user.
   * @param passwordHash - The hashed password of the new user.
   * @returns A promise resolving to the created user.
   */
  async createUser(email: string, passwordHash: string): Promise<UserDB> {
    const result = await this.query.query(
      "INSERT INTO users (email, password_hash) " +
        "VALUES ($1, $2) RETURNING id, email, password_hash, is_active",
      [email, passwordHash],
    );
    return result.rows[0];
  }

  /**
   * Finds an existing user by email, or creates a new passwordless user (no password).
   * @param email - The email address to find or create.
   * @returns A promise resolving to the existing or newly created user.
   */
  async findOrCreatePasswordlessUser(email: string): Promise<UserDB> {
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }

    const result = await this.query.query(
      "INSERT INTO users (email) " +
        "VALUES ($1) RETURNING id, email, password_hash, is_active",
      [email],
    );
    return result.rows[0];
  }

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
    await this.query.query(
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
    const result = await this.query.query(
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
    await this.query.query(
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
    await this.query.query(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1",
      [userId],
    );
  }

  /**
   * Creates an OTP code for a user in the database.
   * @param userId - The ID of the user the OTP is for.
   * @param code - The 6-digit OTP code.
   * @param expiresAt - The expiration time of the OTP.
   * @returns A promise that resolves when the OTP is created.
   */
  async createOtpCode(
    userId: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.query.query(
      "INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [userId, code, expiresAt],
    );
  }

  /**
   * Retrieves a valid (unused, non-expired) OTP code for a user.
   * @param userId - The ID of the user.
   * @param code - The OTP code to validate.
   * @returns A promise resolving to the OTP record or null if not valid.
   */
  async getValidOtpCode(
    userId: string,
    code: string,
  ): Promise<OtpCodeDB | null> {
    const result = await this.query.query(
      "SELECT id, user_id, code, expires_at, used FROM otp_codes " +
        "WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()",
      [userId, code],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Marks all OTP codes for a user as used, invalidating them.
   * @param userId - The ID of the user whose OTP codes should be invalidated.
   * @returns A promise that resolves when all OTPs are invalidated.
   */
  async invalidateAllUserOtpCodes(userId: string): Promise<void> {
    await this.query.query(
      "UPDATE otp_codes SET used = TRUE WHERE user_id = $1",
      [userId],
    );
  }
}
