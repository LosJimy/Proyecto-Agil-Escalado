import { Client, Pool } from "pg";
import { OtpCodeDB, RefreshTokenDB, UserDB } from "./auth.types";

export class AuthRepository {
  constructor(private readonly query: Client | Pool) {}

  async getUserByEmail(email: string): Promise<UserDB | null> {
    const result = await this.query.query(
      "SELECT id, email, password_hash, is_active FROM users WHERE email = $1",
      [email],
    );

    return result.rows[0] ?? null;
  }

  async getUserById(id: string): Promise<UserDB | null> {
    const result = await this.query.query(
      "SELECT id, email, password_hash, is_active FROM users WHERE id = $1",
      [id],
    );

    return result.rows[0] ?? null;
  }

  async createUser(email: string, passwordHash: string): Promise<UserDB> {
    const result = await this.query.query(
      "INSERT INTO users (email, password_hash) " +
        "VALUES ($1, $2) RETURNING id, email, password_hash, is_active",
      [email, passwordHash],
    );
    return result.rows[0];
  }

  async findOrCreatePasswordlessUser(email: string): Promise<UserDB> {
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }

    // Creates a new user with no password (passwordless)
    const result = await this.query.query(
      "INSERT INTO users (email) " +
        "VALUES ($1) RETURNING id, email, password_hash, is_active",
      [email],
    );
    return result.rows[0];
  }

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

  async getRefreshTokenByHash(
    tokenHash: string,
  ): Promise<RefreshTokenDB | null> {
    const result = await this.query.query(
      "SELECT id, user_id, token_hash, expires_at, revoked FROM refresh_tokens " +
        "WHERE token_hash = $1",
      [tokenHash],
    );

    return result.rows[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.query.query(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1",
      [tokenHash],
    );
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.query.query(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1",
      [userId],
    );
  }

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

  async getValidOtpCode(
    userId: string,
    code: string,
  ): Promise<OtpCodeDB | null> {
    // Valid OTP: not used and not expired
    const result = await this.query.query(
      "SELECT id, user_id, code, expires_at, used FROM otp_codes " +
        "WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()",
      [userId, code],
    );

    return result.rows[0] ?? null;
  }

  async invalidateAllUserOtpCodes(userId: string): Promise<void> {
    await this.query.query(
      "UPDATE otp_codes SET used = TRUE WHERE user_id = $1",
      [userId],
    );
  }
}
