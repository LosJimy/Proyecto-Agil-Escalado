import bcrypt from "bcrypt";
import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { UserAlreadyExistsError } from "./auth.errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../../shared/utils/jwt";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Provides authentication-related services, including user login, registration, and
 * token refreshing.
 */
export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Hashes a token using SHA-256.
   * @param {string} token - The token to hash.
   * @returns {string} - The hashed token.
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Authenticates a user with the provided email and password. If the credentials are
   * valid, it generates and returns an access token and a refresh token.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<AuthResponse | null>} - A promise resolving to the
   * authentication response or null if invalid.
   */
  async login(email: string, password: string): Promise<AuthResponse | null> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user || !user.is_active) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    return this.generateTokenPair(user.id, user.email);
  }

  /**
   * Registers a new user with the provided email and password. Validates that the user
   * does not already exist, hashes the password, creates the user, and returns an
   * access token and a refresh token.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<AuthResponse>} - A promise resolving to the authentication
   * response.
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    const existingUser = await this.authRepository.getUserByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await this.authRepository.createUser(email, passwordHash);

    return this.generateTokenPair(newUser.id, newUser.email);
  }

  /**
   * Refreshes the access token using the provided refresh token. Validates the refresh
   * token, checks if it's revoked or expired, and if valid, generates and returns a
   * new access token and refresh token pair.
   * @param {string} token - The refresh token.
   * @returns {Promise<AuthResponse | null>} - A promise resolving to the
   * authentication response or null if invalid.
   */
  async refreshToken(token: string): Promise<AuthResponse | null> {
    try {
      const payload = verifyToken(token);
      const tokenHash = this.hashToken(token);

      const storedToken = await this.authRepository.getRefreshToken(tokenHash);

      if (
        !storedToken ||
        storedToken.revoked ||
        new Date() > storedToken.expires_at
      ) {
        if (storedToken && !storedToken.revoked) {
          await this.authRepository.revokeRefreshToken(tokenHash);
        }
        return null;
      }

      const user = await this.authRepository.getUserById(payload.sub);
      if (!user || !user.is_active) {
        return null;
      }

      // Revoke old token and generate new pair (Rotation)
      await this.authRepository.revokeRefreshToken(tokenHash);
      return this.generateTokenPair(user.id, user.email);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generates a new access token and refresh token pair for the given user ID and
   * email.
   * @param {string} userId - The user's ID.
   * @param {string} email - The user's email.
   * @returns {Promise<AuthResponse>} - A promise resolving to the authentication
   * response.
   */
  private async generateTokenPair(
    userId: string,
    email: string,
  ): Promise<AuthResponse> {
    const accessToken = signAccessToken({ sub: userId, email });
    const refreshToken = signRefreshToken({ sub: userId, email });

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.authRepository.createRefreshToken(userId, tokenHash, expiresAt);

    return { accessToken, refreshToken };
  }
}
