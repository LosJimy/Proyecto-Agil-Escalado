import path from "path";
import { Client } from "pg";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
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
});

afterAll(async () => {
  await teardownTestApp(client, container);
});

beforeEach(async () => {
  // Clean the database between tests
  await client.query("TRUNCATE users, refresh_tokens CASCADE");
});

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

      expect(result.status).toBe(400);
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

      expect(result.status).toBe(400);
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
});
