import crypto from "crypto";
import { UsersRepository } from "./users.repository";
import { AuthRepository } from "../auth/auth.repository";
import { EmailService } from "../../shared/utils/email";

const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS ?? 300);

function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  async requestAccountDeactivation(email: string): Promise<boolean> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user || !user.is_active) {
      return false;
    }

    await this.authRepository.invalidateAllUserOtpCodes(user.id);

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    const codeHash = hashOtpCode(code);
    await this.authRepository.createOtpCode(
      user.id,
      codeHash,
      "deactivate",
      expiresAt,
    );

    await this.emailService.sendOtpEmail(email, code, "deactivate");

    return true;
  }

  async confirmDeactivationWithOtp(
    email: string,
    code: string,
  ): Promise<boolean> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user || !user.is_active) {
      return false;
    }

    const validOtp = await this.authRepository.getValidOtpCode(
      user.id,
      hashOtpCode(code),
      "deactivate",
    );

    if (!validOtp) {
      return false;
    }

    Promise.all([
      this.authRepository.invalidateAllUserOtpCodes(user.id),
      this.authRepository.revokeAllUserRefreshTokens(user.id),
    ]);

    await this.usersRepository.deactivateUser(user.id);

    return true;
  }
}
