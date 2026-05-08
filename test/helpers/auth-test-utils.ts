import { Client } from "pg";
import { createApp } from "../../src/shared/factories/app-factory";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import path from "path";
import { EmailService } from "../../src/shared/utils/email";

export class FakeEmailService extends EmailService {
  public sentEmails: {
    to: string;
    otp: string;
    purpose: "login" | "deactivate";
  }[] = [];

  override async sendOtpEmail(
    to: string,
    otp: string,
    purpose: "login" | "deactivate",
  ): Promise<void> {
    this.sentEmails.push({ to, otp, purpose });
  }
}

export async function setupTestApp(): Promise<{
  client: Client;
  app: ReturnType<typeof createApp>;
  container: StartedPostgreSqlContainer;
  emailService: FakeEmailService;
}> {
  const container = await new PostgreSqlContainer("postgres:15-alpine")
    .withCopyFilesToContainer([
      {
        source: path.resolve(__dirname, "../../db/schema.sql"),
        target: "/docker-entrypoint-initdb.d/schema.sql",
      },
    ])
    .start();

  const client = new Client({
    connectionString: container.getConnectionUri(),
  });
  await client.connect();

  const emailService = new FakeEmailService();
  const app = createApp(client, { emailService });

  return { client, app, container, emailService };
}

export async function teardownTestApp(
  client: Client,
  container: StartedPostgreSqlContainer,
) {
  await client.end();
  await container.stop();
}

export async function getLatestOtpCode(client: Client, email: string) {
  const result = await client.query(
    "SELECT oc.code_hash FROM otp_codes oc " +
      "JOIN users u ON oc.user_id = u.id " +
      "WHERE u.email = $1 AND oc.purpose = 'login' " +
      "ORDER BY oc.expires_at DESC LIMIT 1",
    [email],
  );

  return result.rows[0]?.code_hash ?? null;
}
