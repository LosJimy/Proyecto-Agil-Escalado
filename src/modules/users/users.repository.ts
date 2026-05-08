import { Client, Pool } from "pg";
import { UserDB } from "./users.types";

export class UsersRepository {
  constructor(private readonly query: Client | Pool) {}

  async deactivateUser(userId: string): Promise<void> {
    await this.query.query("UPDATE users SET is_active = FALSE WHERE id = $1", [
      userId,
    ]);
  }
}
