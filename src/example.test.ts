import path from "path";
import { Client } from "pg";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { expect, test } from "vitest";

test("example test", async () => {
  await using container = await new PostgreSqlContainer("postgres:15-alpine")
    .withCopyFilesToContainer([
      {
        source: path.resolve(__dirname, "../db/schema.sql"),
        target: "/docker-entrypoint-initdb.d/schema.sql",
      },
    ])
    .start();

  const client = new Client({
    connectionString: container.getConnectionUri(),
  });
  await client.connect();

  try {
    const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('users', 'refresh_tokens')
  `);
    const tableNames = result.rows.map((row) => row.table_name);

    expect(tableNames).toContain("users");
    expect(tableNames).toContain("refresh_tokens");
  } finally {
    await client.end();
  }
});
