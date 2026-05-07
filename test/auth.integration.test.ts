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
import request from "supertest";
import { createApp } from "../src/shared/factories/app-factory";
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

async function getLatestOtpCode(
  dbClient: Client,
  email: string,
): Promise<string> {
  const result = await dbClient.query(
    `SELECT oc.code FROM otp_codes oc
     JOIN users u ON oc.user_id = u.id
     WHERE u.email = $1 AND oc.used = FALSE
     ORDER BY oc.created_at DESC LIMIT 1`,
    [email],
  );
  return result.rows[0]?.code;
}

describe("Auth Routes Integration Tests", () => {
  describe("POST /auth/register", () => {
    test("should register a new user and return tokens", async () => {
      const result = await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      expect(result.status).toBe(201);
      expect(result.body).toHaveProperty("accessToken");
      expect(result.body).toHaveProperty("refreshToken");
    });

    test("should return 400 for invalid request body", async () => {
      const result = await request(app)
        .post("/auth/register")
        .send("invalid-body");

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing email or password", async () => {
      const result = await request(app).post("/auth/register").send({
        email: "test@gmail.com",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for invalid email format", async () => {
      const result = await request(app).post("/auth/register").send({
        email: "invalid-email",
        password: "Password123",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for invalid password format", async () => {
      const result = await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "short",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 409 for already existing user", async () => {
      // First registration should succeed
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      // Second registration with the same email should fail
      const result = await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "AnotherPassword123",
      });

      expect(result.status).toBe(409);
      expect(result.body).toHaveProperty("message");
    });
  });

  describe("POST /auth/login", () => {
    test("should log in an existing user and return tokens", async () => {
      // First, register a user
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      // Then, log in
      const result = await request(app).post("/auth/login").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("accessToken");
      expect(result.body).toHaveProperty("refreshToken");
    });

    test("should return 400 for invalid request body", async () => {
      const result = await request(app)
        .post("/auth/login")
        .send("invalid-body");

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing email or password", async () => {
      const result = await request(app).post("/auth/login").send({
        email: "test@gmail.com",
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

      // Then, attempt to log in with invalid credentials
      const result = await request(app).post("/auth/login").send({
        email: "test@gmail.com",
        password: "WrongPassword123",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });
  });

  describe("POST /auth/logout", () => {
    test("should log out a user by revoking the refresh token", async () => {
      // First, register and log in a user to get a refresh token
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      const loginResult = await request(app).post("/auth/login").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      const refreshToken = loginResult.body.refreshToken;

      // Then, log out using the refresh token
      const logoutResult = await request(app).post("/auth/logout").send({
        refreshToken,
      });

      expect(logoutResult.status).toBe(200);
      expect(logoutResult.body).toHaveProperty("message");
    });

    test("should return 400 for invalid request body", async () => {
      const result = await request(app)
        .post("/auth/logout")
        .send("invalid-body");

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing refresh token", async () => {
      const result = await request(app).post("/auth/logout").send({});

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 401 for invalid refresh token", async () => {
      const result = await request(app).post("/auth/logout").send({
        refreshToken: "invalid-token",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });
  });

  describe("POST /auth/refresh", () => {
    const endpoint = "/auth/refresh";

    test("should refresh tokens using a valid refresh token", async () => {
      // First, register and log in a user to get a refresh token
      await request(app).post("/auth/register").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      const loginResult = await request(app).post("/auth/login").send({
        email: "test@gmail.com",
        password: "Password123",
      });

      const refreshToken = loginResult.body.refreshToken;

      // Then, refresh the tokens
      const refreshResult = await request(app).post("/auth/refresh").send({
        refreshToken,
      });

      expect(refreshResult.status).toBe(200);
      expect(refreshResult.body).toHaveProperty("accessToken");
      expect(refreshResult.body).toHaveProperty("refreshToken");
    });

    test("should return 400 for invalid request body", async () => {
      const result = await request(app)
        .post("/auth/refresh")
        .send("invalid-body");

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing refresh token", async () => {
      const result = await request(app).post("/auth/refresh").send({});

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 401 for invalid refresh token", async () => {
      const result = await request(app).post("/auth/refresh").send({
        refreshToken: "invalid-token",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });
  });

  describe("GET /auth/.well-known/jwks.json", () => {
    test("should return JWKS", async () => {
      const result = await request(app).get("/auth/.well-known/jwks.json");

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("keys");
      expect(Array.isArray(result.body.keys)).toBe(true);
    });
  });

  describe("POST /auth/otp/request", () => {
    test("should accept a new email and return success message", async () => {
      const result = await request(app).post("/auth/otp/request").send({
        email: "otp-user@gmail.com",
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("message");
      expect(result.body).not.toHaveProperty("otp");
    });

    test("should create an OTP code in the database", async () => {
      await request(app).post("/auth/otp/request").send({
        email: "otp-user@gmail.com",
      });

      const otp = await getLatestOtpCode(client, "otp-user@gmail.com");
      expect(otp).not.toBeNull();
      expect(otp).toMatch(/^\d{6}$/);
    });

    test("should accept an existing user's email", async () => {
      // First, register a user with password
      await request(app).post("/auth/register").send({
        email: "existing@gmail.com",
        password: "Password123",
      });

      // Then, request OTP for the same email
      const result = await request(app).post("/auth/otp/request").send({
        email: "existing@gmail.com",
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing email", async () => {
      const result = await request(app).post("/auth/otp/request").send({});

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for invalid email format", async () => {
      const result = await request(app).post("/auth/otp/request").send({
        email: "not-an-email",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for invalid request body", async () => {
      const result = await request(app)
        .post("/auth/otp/request")
        .send("invalid-body");

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should invalidate previous OTPs when a new one is requested", async () => {
      // Request first OTP
      await request(app).post("/auth/otp/request").send({
        email: "otp-user@gmail.com",
      });
      const firstOtp = await getLatestOtpCode(client, "otp-user@gmail.com");

      // Request second OTP
      await request(app).post("/auth/otp/request").send({
        email: "otp-user@gmail.com",
      });
      const secondOtp = await getLatestOtpCode(client, "otp-user@gmail.com");

      // First OTP should no longer work
      const verifyFirst = await request(app).post("/auth/otp/verify").send({
        email: "otp-user@gmail.com",
        otp: firstOtp,
      });
      expect(verifyFirst.status).toBe(401);

      // Second OTP should work
      const verifySecond = await request(app).post("/auth/otp/verify").send({
        email: "otp-user@gmail.com",
        otp: secondOtp,
      });
      expect(verifySecond.status).toBe(200);
    });
  });

  describe("POST /auth/otp/verify", () => {
    test("should verify a valid OTP and return tokens", async () => {
      // Request OTP
      await request(app).post("/auth/otp/request").send({
        email: "otp-verify@gmail.com",
      });
      const otp = await getLatestOtpCode(client, "otp-verify@gmail.com");

      // Verify OTP
      const result = await request(app).post("/auth/otp/verify").send({
        email: "otp-verify@gmail.com",
        otp,
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("accessToken");
      expect(result.body).toHaveProperty("refreshToken");
    });

    test("should return 401 for wrong OTP code", async () => {
      // Request OTP
      await request(app).post("/auth/otp/request").send({
        email: "otp-wrong@gmail.com",
      });

      // Verify with wrong OTP
      const result = await request(app).post("/auth/otp/verify").send({
        email: "otp-wrong@gmail.com",
        otp: "000000",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 401 for non-existent user email", async () => {
      const result = await request(app).post("/auth/otp/verify").send({
        email: "nonexistent@gmail.com",
        otp: "123456",
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for missing email or otp", async () => {
      const result = await request(app).post("/auth/otp/verify").send({
        email: "test@gmail.com",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should return 400 for invalid request body", async () => {
      const result = await request(app)
        .post("/auth/otp/verify")
        .send("invalid-body");

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("message");
    });

    test("should not allow OTP reuse after successful verification", async () => {
      // Request OTP
      await request(app).post("/auth/otp/request").send({
        email: "otp-reuse@gmail.com",
      });
      const otp = await getLatestOtpCode(client, "otp-reuse@gmail.com");

      // First verification should succeed
      const firstVerify = await request(app).post("/auth/otp/verify").send({
        email: "otp-reuse@gmail.com",
        otp,
      });
      expect(firstVerify.status).toBe(200);

      // Second verification with same OTP should fail
      const secondVerify = await request(app).post("/auth/otp/verify").send({
        email: "otp-reuse@gmail.com",
        otp,
      });
      expect(secondVerify.status).toBe(401);
    });

    test("should return 401 for expired OTP", async () => {
      // Request OTP
      await request(app).post("/auth/otp/request").send({
        email: "otp-expired@gmail.com",
      });
      const otp = await getLatestOtpCode(client, "otp-expired@gmail.com");

      // Manually expire the OTP in the database
      await client.query(
        "UPDATE otp_codes SET expires_at = NOW() - INTERVAL '1 minute'",
      );

      // Verification should fail
      const result = await request(app).post("/auth/otp/verify").send({
        email: "otp-expired@gmail.com",
        otp,
      });

      expect(result.status).toBe(401);
      expect(result.body).toHaveProperty("message");
    });
  });
});
