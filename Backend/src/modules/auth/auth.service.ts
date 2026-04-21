import bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { signToken } from '../../shared/utils/jwt';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(email: string, password: string): Promise<string | null> {
    const user = await this.authRepository.getUserByEmail(email);

    if (!user || !user.is_active) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
    });

    return token;
  }
}
