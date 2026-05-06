import { Client } from "pg";
import { createApp } from "../../src/shared/factories/app-factory";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import path from "path";
import { expect, test } from "vitest";
import request from "supertest";

/**
 * Helper function to set up the test application with a PostgreSQL container.
 * @returns A promise that resolves to an object containing the PostgreSQL client,
 * the Express app instance, and the container.
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
 * and stopping the container.
 * @param client - The PostgreSQL client to be closed.
 * @param container - The PostgreSQL container to be stopped.
 */
export async function teardownTestApp(
  client: Client,
  container: StartedPostgreSqlContainer,
) {
  await client.end();
  await container.stop();
}
