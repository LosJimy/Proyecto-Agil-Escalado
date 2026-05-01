import bcrypt from "bcrypt";
import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { UserAlreadyExistsError } from "./auth.errors";
import {
  decodeBase64,
  getPublicKeyJWK,
  signAccessToken,
} from "../../shared/utils/jwt";
import { UserRepository } from "../user/user.repository";

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
  private userRepository: UserRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.userRepository = new UserRepository();
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
    const user = await this.userRepository.getUserByEmail(email);

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
   * Logs out a user by revoking the provided refresh token, preventing it from being
   * used to generate new access tokens.
   * @param {string} token - The refresh token to revoke.
   * @returns {Promise<boolean>} - A promise that resolves to true if the token is
   * successfully revoked, false otherwise.
   */
  async logout(token: string): Promise<boolean> {
    const storedToken = await this.authRepository.getRefreshToken(token);
    if (storedToken && !storedToken.revoked) {
      await this.authRepository.revokeRefreshToken(token);
      return true;
    } else {
      console.warn(
        `⚠️ Attempted to revoke non-existent or already revoked token: ${token}`,
      );
      return false;
    }
  }

  /**
   * Registers a new user with the provided email and password. Validates that the user
   * does not already exist, hashes the password, creates the user, and returns an
   * access token and a refresh token.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<AuthResponse>} - A promise resolving to the authentication
   * response.
   * @throws {UserAlreadyExistsError} - If a user with the given email already exists.
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    const existingUser = await this.userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await this.userRepository.createUser(email, passwordHash);

    return this.generateTokenPair(newUser.id, newUser.email);
  }

  /**
   * Generates a new refresh token.
   * @returns {string} - The generated refresh token.
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString("hex");
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
      const storedToken = await this.authRepository.getRefreshToken(token);

      // Rotate the refresh token if it's valid, otherwise return null
      if (
        !storedToken ||
        storedToken.revoked ||
        new Date() > storedToken.expires_at
      ) {
        if (storedToken && !storedToken.revoked) {
          await this.authRepository.revokeRefreshToken(token);
        }
        return null;
      }

      const user = await this.userRepository.getUserById(storedToken.user_id);
      if (!user || !user.is_active) {
        return null;
      }

      await this.authRepository.revokeRefreshToken(token);
      return this.generateTokenPair(user.id, user.email);
    } catch (error) {
      console.error("❌ Error in AuthService.refreshToken:", error);
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

    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Revoke all existing refresh tokens for the user before creating a new one
    await this.authRepository.revokeAllUserRefreshTokens(userId);

    await this.authRepository.createRefreshToken(
      userId,
      refreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Retrieves the JSON Web Key Set (JWKS) containing the public key used for verifying
   * JWTs.
   * @returns {Promise<{ keys: any[] }>} - A promise resolving to an object containing
   * the JWKS.
   * @throws {Error} - If the JWT public key is not set in environment variables.
   */
  async getJwks(): Promise<{ keys: any[] }> {
    const publicKey = decodeBase64(process.env.JWT_PUBLIC_KEY || "");
    if (!publicKey) {
      throw new Error("⚠️ JWT public key is not set in environment variables");
    }
    const jwk = await getPublicKeyJWK(publicKey);

    return {
      keys: [jwk],
    };
  }
}
