import jwt from "jsonwebtoken";

// Load RSA keys from environment variables (base64 encoded)
const privateKey = Buffer.from(
  process.env.JWT_PRIVATE_KEY || "",
  "base64",
).toString("utf8");
const publicKey = Buffer.from(
  process.env.JWT_PUBLIC_KEY || "",
  "base64",
).toString("utf8");

if (!privateKey || !publicKey) {
  console.warn("⚠️ JWT keys are not set in environment variables");
}

export interface JWTPayload {
  sub: string;
  email: string;
  [key: string]: any;
}

/**
 * Signs an access token with the provided payload.
 * @param payload - The payload for the access token.
 * @returns The signed access token.
 */
export const signAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });
};

/**
 * Signs a refresh token with the provided payload.
 * @param payload - The payload for the refresh token.
 * @returns The signed refresh token.
 */
export const signRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d",
  });
};

/**
 * Verifies a JWT token and returns its payload.
 * @param token - The JWT token to verify.
 * @returns The verified token payload.
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as JWTPayload;
};
