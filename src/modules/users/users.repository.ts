import { Client, Pool } from "pg";
import { UserDB } from "./users.types";

export class UsersRepository {
  constructor(private readonly query: Client | Pool) {}

  async deactivateUser(userId: string): Promise<void> {
    await this.query.query("UPDATE users SET is_active = FALSE WHERE id = $1", [
      userId,
    ]);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.query.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [passwordHash, userId],
    );
  }

  async isUserActive(userId: string): Promise<boolean> {
    const result = await this.query.query(
      "SELECT is_active FROM users WHERE id = $1",
      [userId],
    );

    return result.rows[0]?.is_active ?? false;
  }
}
