import path from "path";
import { Client } from "pg";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { expect, test } from "vitest";
import { createApp } from "../shared/factories/app-factory";
import request from "supertest";

test("example test", async () => {
  await using container = await new PostgreSqlContainer("postgres:15-alpine")
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

  try {
    const result = await request(app).post("/auth/register").send({
      email: "pablo@gmail.com",
      password: "Password123",
    });

    expect(result.status).toBe(201);
    expect(result.body).toHaveProperty("accessToken");
    expect(result.body).toHaveProperty("refreshToken");
  } finally {
    await client.end();
  }
});
