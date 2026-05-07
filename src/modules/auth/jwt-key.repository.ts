import { Client, Pool } from "pg";
import { JwtKeyDB } from "./auth.types";

export class JwtKeyRepository {
  constructor(private readonly query: Client | Pool) {}

  async getActiveKeys(): Promise<JwtKeyDB[]> {
    const result = await this.query.query(
      "SELECT id, kid, private_key, public_key, is_active, created_at" +
        " FROM jwt_keys WHERE is_active = TRUE ORDER BY created_at DESC",
    );
    return result.rows;
  }

  async getLatestActiveKey(): Promise<JwtKeyDB | null> {
    const result = await this.query.query(
      "SELECT id, kid, private_key, public_key, is_active, created_at" +
        " FROM jwt_keys WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1",
    );

    return result.rows[0] ?? null;
  }

  async getKeyByKid(kid: string): Promise<JwtKeyDB | null> {
    const result = await this.query.query(
      "SELECT id, kid, private_key, public_key, is_active, created_at" +
        " FROM jwt_keys WHERE kid = $1",
      [kid],
    );

    return result.rows[0] ?? null;
  }

  async createKey(
    kid: string,
    privateKey: string,
    publicKey: string,
  ): Promise<JwtKeyDB> {
    const result = await this.query.query(
      "INSERT INTO jwt_keys (kid, private_key, public_key) VALUES ($1, $2, $3) " +
        "RETURNING id, kid, private_key, public_key, is_active, created_at",
      [kid, privateKey, publicKey],
    );
    return result.rows[0];
  }

  async deactivateKey(kid: string): Promise<void> {
    await this.query.query(
      "UPDATE jwt_keys SET is_active = FALSE WHERE kid = $1",
      [kid],
    );
  }
}
