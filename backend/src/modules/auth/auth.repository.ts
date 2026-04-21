import { query } from '../../shared/database/db';

export interface UserDB {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
}

export class AuthRepository {
  async getUserByEmail(email: string): Promise<UserDB | null> {
    const result = await query(
      'SELECT id, email, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }
}
