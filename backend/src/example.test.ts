import { Client } from "pg";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { expect, test } from "vitest";

test("example test", async () => {
  await using container = await new PostgreSqlContainer(
    "postgres:15-alpine",
  ).start();

  const client = new Client({
    connectionString: container.getConnectionUri(),
  });
  await client.connect();

  const result = await client.query("SELECT 1");
  expect(result.rows[0]).toEqual({ "?column?": 1 });

  await client.end();
}, 15_000);
