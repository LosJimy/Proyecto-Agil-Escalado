import { Client } from "pg";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { createApp } from "../src/shared/factories/app-factory";
import request from "supertest";
import { setupTestApp, teardownTestApp } from "./helpers/auth-test-utils";

let client: Client;
let app: ReturnType<typeof createApp>;
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  const setup = await setupTestApp();
  client = setup.client;
  app = setup.app;
  container = setup.container;
}, 60000);

afterAll(async () => {
  await teardownTestApp(client, container);
});

beforeEach(async () => {
  await client.query("TRUNCATE users, refresh_tokens, otp_codes CASCADE");
});

describe("Users Routes Integration Tests", () => {
  describe("POST /users/deactivate", () => {
    test("should deactivate user account with valid credentials", async () => {
      // First, register a user to get valid credentials
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      // Now, attempt to deactivate the account with correct credentials
      const res = await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    test("should return 400 for missing email or password", async () => {
      const result = await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for invalid email format", async () => {
      const result = await request(app).post("/users/deactivate").send({
        email: "invalid-email",
        password: "Password123",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for invalid password format", async () => {
      const result = await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
        password: "short",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 401 for invalid credentials", async () => {
      // First, register a user
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      // Then, attempt to deactivate the account with incorrect password
      const result = await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
        password: "WrongPassword123",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });
  });
});
