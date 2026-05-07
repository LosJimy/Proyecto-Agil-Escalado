import { Client } from "pg";
import { createApp } from "../../src/shared/factories/app-factory";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import path from "path";

/**
 * Helper function to set up the test application with a PostgreSQL container
 */
export async function setupTestApp(): Promise<{
  client: Client;
  app: ReturnType<typeof createApp>;
  container: StartedPostgreSqlContainer;
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

  const app = createApp(client);

  return { client, app, container };
}

/**
 * Helper function to tear down the test application by closing the PostgreSQL client
 */
export async function teardownTestApp(
  client: Client,
  container: StartedPostgreSqlContainer,
) {
  await client.end();
  await container.stop();
}
