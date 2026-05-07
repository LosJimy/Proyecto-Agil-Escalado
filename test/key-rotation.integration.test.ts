import { Client } from "pg";
import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import request from "supertest";
import { setupTestApp, teardownTestApp } from "./helpers/auth-test-utils";
import jwt from "jsonwebtoken";
import { AuthService } from "../src/modules/auth/auth.service";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { JwtKeyRepository } from "../src/modules/auth/jwt-key.repository";

let client: Client;
let app: any;
let container: any;

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
  await client.query(
    "TRUNCATE users, refresh_tokens, otp_codes, jwt_keys CASCADE",
  );
});

describe("JWT Key Rotation Integration Tests", () => {
  test("should sign tokens with the latest key and rotate successfully", async () => {
    // 1. Register to trigger initial seed and get a token
    const registerRes = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "Password123",
    });

    expect(registerRes.status).toBe(201);
    const token1 = registerRes.body.accessToken;
    const decoded1 = jwt.decode(token1, { complete: true }) as any;
    expect(decoded1.header.kid).toBeDefined();
    const kid1 = decoded1.header.kid;

    // 2. Check JWKS contains the key
    const jwksRes1 = await request(app).get("/auth/.well-known/jwks.json");
    expect(jwksRes1.body.keys.some((k: any) => k.kid === kid1)).toBe(true);

    // 3. Forcefully rotate keys using AuthService
    const authRepository = new AuthRepository(client);
    const jwtKeyRepository = new JwtKeyRepository(client);
    const authService = new AuthService(authRepository, jwtKeyRepository);

    await authService.rotateKeys();

    // 4. Register another user to get a token signed with the NEW key
    const loginRes = await request(app).post("/auth/register").send({
      email: "test2@example.com",
      password: "Password123",
    });

    expect(loginRes.status).toBe(201);
    const token2 = loginRes.body.accessToken;
    const decoded2 = jwt.decode(token2, { complete: true }) as any;
    const kid2 = decoded2.header.kid;

    // Verify kid has changed
    expect(kid2).not.toBe(kid1);

    // 5. Verify JWKS now contains both keys
    const jwksRes2 = await request(app).get("/auth/.well-known/jwks.json");
    expect(jwksRes2.body.keys.some((k: any) => k.kid === kid1)).toBe(true);
    expect(jwksRes2.body.keys.some((k: any) => k.kid === kid2)).toBe(true);
  });

  test("should support multiple keys in JWKS", async () => {
    // Register to seed first key
    await request(app).post("/auth/register").send({
      email: "test1@example.com",
      password: "Password123",
    });

    // Seed second key manually to simulate rotation
    const dummyKey =
      "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUE0Y3FncU54bXJyUWNLRG4wVHE4SQpxM3NmWEo5Yk8wMXYxQ2U1NnA5V0tEMjlIVkY0MEJEZUhZT096RUlvR2NldklPNmtmcFRGQ3Vod2V2SWUvMVVpCnQ2QlFqMmNySXdwc050QzFBSUNJemZ2VWxYUXl6Y2Ftd0t6SStiNjR5UXBFTTF5bjJhSDNwVEpycnVCNnp4eEwKM1lRTm1admhwaW4vaXU0dXhoSWVlREhSZ2t0SjVKVnBlaWVHUmgybXRUVTNtcDcxcjdMU0JrSHR6T1BtQjZzSApQWDhCSHVDL2JaTjVTUEVybHJvZUtSWXpGeExWUEJES252ZE5OeENHaTAvKzk4Yml1WnduY3JneCtHdzZWYXRuCjRpTHdxTllWejdBbHJJak5OcWd1ZmNSck1nNUJWWkdCTVQ3RzZXSmZURmRRUU5mMWR6cm56NmN2TE80aElXR2UKb3dJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==";
    const publicKey = Buffer.from(dummyKey, "base64").toString("utf8");

    await client.query(
      "INSERT INTO jwt_keys (kid, private_key, public_key) VALUES ($1, $2, $3)",
      ["kid-2", "private-2", publicKey],
    );

    const jwksRes = await request(app).get("/auth/.well-known/jwks.json");
    expect(jwksRes.status).toBe(200);
    expect(jwksRes.body.keys).toBeDefined();
    expect(jwksRes.body.keys.length).toBeGreaterThanOrEqual(2);
    expect(jwksRes.body.keys.some((k: any) => k.kid === "kid-2")).toBe(true);
  });
});
