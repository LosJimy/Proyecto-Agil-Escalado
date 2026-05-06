import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { AuthService, AuthResponse } from "./auth.service";
import { EmailService } from "../../shared/utils/email";
import { logger } from "../../shared/utils/logger";
import { LOGS_MESSAGES } from "../../shared/constants/logsMessages";

const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS ?? 300);

/**
 * Service for passwordless authentication via OTP (One-Time Password).
 * Handles OTP generation, storage in the database, and verification.
 */
export class OtpService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generates a cryptographically secure 6-digit OTP code (000000–999999).
   * @returns The generated OTP code as a zero-padded string.
   */
  private generateOtpCode(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  }

  /**
   * Requests an OTP for the given email. Finds or creates a passwordless user,
   * invalidates any existing OTPs, generates a new one, stores it in the database,
   * and sends it via email.
   * @param email - The email address to send the OTP to.
   * @returns A promise resolving to an object with a confirmation message.
   */
  async requestOtp(email: string): Promise<{ message: string }> {
    const user = await this.authRepository.findOrCreatePasswordlessUser(email);

    // Invalidate any existing OTP codes for this user
    await this.authRepository.invalidateAllUserOtpCodes(user.id);

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    await this.authRepository.createOtpCode(user.id, code, expiresAt);

    await this.emailService.sendOtpEmail(email, code);

    return {
      message: "OTP sent successfully",
    };
  }

  /**
   * Verifies an OTP code for the given email. If valid, invalidates all OTPs for the
   * user and returns an access/refresh token pair.
   * @param email - The user's email address.
   * @param code - The 6-digit OTP code to verify.
   * @returns A promise resolving to the authentication response, or null if invalid.
   */
  async verifyOtp(email: string, code: string): Promise<AuthResponse | null> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user) {
      logger.warn(LOGS_MESSAGES.ERRORS.AUTH.SERVICE.USER_NOT_FOUND(email));
      return null;
    }

    if (!user.is_active) {
      logger.warn(LOGS_MESSAGES.ERRORS.AUTH.SERVICE.USER_INACTIVE(email));
      return null;
    }

    const validOtp = await this.authRepository.getValidOtpCode(user.id, code);

    if (!validOtp) {
      logger.warn(LOGS_MESSAGES.ERRORS.AUTH.SERVICE.OTP_INVALID(email));
      return null;
    }

    // Invalidate all OTPs for this user (single-use)
    await this.authRepository.invalidateAllUserOtpCodes(user.id);

    return this.authService.generateTokenPair(user.id, user.email);
  }
}
