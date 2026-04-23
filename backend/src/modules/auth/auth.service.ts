import bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { UserAlreadyExistsError } from './auth.errors';
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

  async register(email: string, password: string): Promise<string> {
    const existingUser = await this.authRepository.getUserByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await this.authRepository.createUser(email, passwordHash);

    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
    });

    return token;
  }
}
