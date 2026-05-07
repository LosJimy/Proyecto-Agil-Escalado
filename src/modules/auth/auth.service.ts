import bcrypt from "bcrypt";
import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { JwtKeyRepository } from "./jwt-key.repository";
import {
  decodeBase64,
  generateRSAKeyPair,
  getPublicKeyJWK,
  signAccessToken,
} from "../../shared/utils/jwt";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtKeyRepository: JwtKeyRepository,
  ) {}

  async login(email: string, password: string): Promise<AuthResponse | null> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user || !user.is_active || !user.password_hash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    return this.generateTokenPair(user.id, user.email);
  }

  async logout(token: string): Promise<boolean> {
    const storedToken = await this.authRepository.getRefreshTokenByHash(token);
    if (storedToken && !storedToken.revoked) {
      await this.authRepository.revokeRefreshToken(token);
      return true;
    }
    return false;
  }

  async register(
    email: string,
    password: string,
  ): Promise<AuthResponse | null> {
    const existingUser = await this.authRepository.getUserByEmail(email);
    if (existingUser) {
      return null;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await this.authRepository.createUser(email, passwordHash);

    return this.generateTokenPair(newUser.id, newUser.email);
  }

  async refreshToken(token: string): Promise<AuthResponse | null> {
    const storedToken = await this.authRepository.getRefreshTokenByHash(token);

    if (
      !storedToken ||
      storedToken.revoked ||
      new Date() > storedToken.expires_at
    ) {
      // Revoke token if it's expired
      if (storedToken && !storedToken.revoked) {
        await this.authRepository.revokeRefreshToken(token);
      }
      return null;
    }

    const user = await this.authRepository.getUserById(storedToken.user_id);
    if (!user || !user.is_active) {
      return null;
    }

    await this.authRepository.revokeRefreshToken(token);
    return this.generateTokenPair(user.id, user.email);
  }

  async generateTokenPair(
    userId: string,
    email: string,
  ): Promise<AuthResponse> {
    let latestKey = await this.jwtKeyRepository.getLatestActiveKey();

    if (!latestKey) {
      latestKey = await this.seedInitialKey();
    }

    const accessToken = signAccessToken(
      { sub: userId, email },
      latestKey.private_key,
      latestKey.kid,
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.revokeAllUserRefreshTokens(userId);

    await this.authRepository.createRefreshToken(
      userId,
      refreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  }

  async getJwks(): Promise<{ keys: any[] }> {
    const activeKeys = await this.jwtKeyRepository.getActiveKeys();

    if (activeKeys.length === 0) {
      const seededKey = await this.seedInitialKey();
      activeKeys.push(seededKey);
    }

    const jwks = await Promise.all(
      activeKeys.map((key) => getPublicKeyJWK(key.public_key, key.kid)),
    );

    return {
      keys: jwks,
    };
  }

  async rotateKeys(): Promise<void> {
    const { kid, privateKey, publicKey } = generateRSAKeyPair();
    await this.jwtKeyRepository.createKey(kid, privateKey, publicKey);
  }

  private async seedInitialKey() {
    // Try to seed initial key from env
    const envPrivateKey = decodeBase64(process.env.JWT_PRIVATE_KEY || "");
    const envPublicKey = decodeBase64(process.env.JWT_PUBLIC_KEY || "");

    if (envPrivateKey && envPublicKey) {
      return await this.jwtKeyRepository.createKey(
        crypto.randomBytes(16).toString("hex"),
        envPrivateKey,
        envPublicKey,
      );
    }

    // If no key in env, generate a new one
    const { kid, privateKey, publicKey } = generateRSAKeyPair();
    return await this.jwtKeyRepository.createKey(kid, privateKey, publicKey);
  }
}
