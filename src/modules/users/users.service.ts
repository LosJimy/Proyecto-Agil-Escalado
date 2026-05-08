import crypto from "crypto";
import { UsersRepository } from "./users.repository";
import { AuthRepository } from "../auth/auth.repository";
import { EmailService } from "../../shared/utils/email";

const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS ?? 300);

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

    await this.authRepository.createOtpCode(user.id, code, expiresAt);

    await this.emailService.sendOtpEmail(email, code);

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

    const validOtp = await this.authRepository.getValidOtpCode(user.id, code);

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
