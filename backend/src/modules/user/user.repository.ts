import { query } from "../../shared/database/db";
import { UserDB } from "./user.types";

export class UserRepository {
  /**
   * Gets a user by their email address.
   * @param email - The email address of the user to retrieve.
   * @returns A promise resolving to the user or null if not found.
   */
  async getUserByEmail(email: string): Promise<UserDB | null> {
    const result = await query(
      "SELECT id, email, password_hash, is_active FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Gets a user by their ID.
   * @param id - The ID of the user to retrieve.
   * @returns A promise resolving to the user or null if not found.
   */
  async getUserById(id: string): Promise<UserDB | null> {
    const result = await query(
      "SELECT id, email, password_hash, is_active FROM users WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Creates a new user in the database.
   * @param email - The email address of the new user.
   * @param passwordHash - The hashed password of the new user.
   * @returns A promise resolving to the created user.
   */
  async createUser(email: string, passwordHash: string): Promise<UserDB> {
    const result = await query(
      "INSERT INTO users (email, password_hash) " +
        "VALUES ($1, $2) RETURNING id, email, password_hash, is_active",
      [email, passwordHash],
    );
    return result.rows[0];
  }
}
