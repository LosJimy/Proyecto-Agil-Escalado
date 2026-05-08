import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { AuthService, AuthResponse } from "./auth.service";
import { EmailService } from "../../shared/utils/email";

const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS ?? 300);

function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export class OtpService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  private generateOtpCode(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  }

  async requestOtp(email: string): Promise<{ message: string }> {
    const user = await this.authRepository.findOrCreatePasswordlessUser(email);

    await this.authRepository.invalidateAllUserOtpCodes(user.id);

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    const codeHash = hashOtpCode(code);
    await this.authRepository.createOtpCode(
      user.id,
      codeHash,
      "login",
      expiresAt,
    );

    await this.emailService.sendOtpEmail(email, code, "login");

    return {
      message: "OTP sent successfully at the given email",
    };
  }

  async verifyOtp(email: string, code: string): Promise<AuthResponse | null> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user || !user.is_active) {
      return null;
    }

    const codeHash = hashOtpCode(code);
    const validOtp = await this.authRepository.getValidOtpCode(
      user.id,
      codeHash,
      "login",
    );

    if (!validOtp) {
      return null;
    }

    await this.authRepository.invalidateAllUserOtpCodes(user.id);

    return this.authService.generateTokenPair(user.id, user.email);
  }
}
