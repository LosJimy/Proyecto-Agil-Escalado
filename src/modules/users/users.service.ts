import bcrypt from "bcrypt";
import { UsersRepository } from "./users.repository";
import { AuthRepository } from "../auth/auth.repository";
import { AppError } from "../../shared/errors/AppError";

/**
 * Provides user management services, including account deactivation,
 * password changes, and user profile management.
 */
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async deactivateAccount(
    email: string,
    password: string,
  ): Promise<void> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.password_hash) {
      throw new AppError("This account does not have a password", 400);
    }

    if (!user.is_active) {
      throw new AppError("User account is already inactive", 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    await this.usersRepository.deactivateUser(user.id);
  }
}
