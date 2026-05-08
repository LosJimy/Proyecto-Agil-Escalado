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
import {
  FakeEmailService,
  setupTestApp,
  teardownTestApp,
} from "./helpers/auth-test-utils";

let client: Client;
let app: ReturnType<typeof createApp>;
let container: StartedPostgreSqlContainer;
let emailService: FakeEmailService;

beforeAll(async () => {
  ({ client, app, container, emailService } = await setupTestApp());
}, 60000);

afterAll(async () => {
  await teardownTestApp(client, container);
});

beforeEach(async () => {
  await client.query("TRUNCATE users, refresh_tokens, otp_codes CASCADE");
  emailService.sentEmails = [];
});

describe("Users Routes Integration Tests", () => {
  describe("POST /users/deactivate", () => {
    test("should send deactivation email", async () => {
      // First, register a user to get valid credentials
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      // Request account deactivation
      const res = await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    test("should return 400 for missing request body", async () => {
      const result = await request(app).post("/users/deactivate").send();

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing email", async () => {
      const result = await request(app).post("/users/deactivate").send({});

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 401 for non-existent user", async () => {
      const result = await request(app).post("/users/deactivate").send({
        email: "nonexistent@gmail.com",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });
  });

  describe("POST /users/deactivate/confirm", () => {
    test("should confirm account deactivation", async () => {
      // First, register a user to get valid credentials
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      // Request account deactivation
      const res = await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
      });

      // Confirm deactivation with OTP
      const otp = emailService.sentEmails[0].otp;
      const confirmRes = await request(app)
        .post("/users/deactivate/confirm")
        .send({
          email: "test@gmail.com",
          otp: otp,
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body).toHaveProperty("message");
    });

    test("should return 400 for missing request body", async () => {
      const result = await request(app)
        .post("/users/deactivate/confirm")
        .send();

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing email or OTP", async () => {
      const result = await request(app)
        .post("/users/deactivate/confirm")
        .send({ email: "test@gmail.com" });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 401 for invalid credentials or OTP", async () => {
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
      });

      const result = await request(app).post("/users/deactivate/confirm").send({
        email: "test@gmail.com",
        otp: "invalid_otp",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });

    test("should deactivate account and prevent login", async () => {
      // Register a user
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      // Request account deactivation
      await request(app).post("/users/deactivate").send({
        email: "test@gmail.com",
      });

      // Confirm deactivation with OTP
      const otp = emailService.sentEmails[0].otp;
      await request(app).post("/users/deactivate/confirm").send({
        email: "test@gmail.com",
        otp: otp,
      });

      // Attempt to login with deactivated account
      const loginResult = await request(app).post("/auth/login").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      expect(loginResult.status).toBe(401);
      expect(loginResult.body).toHaveProperty("message");
    });
  });
});
