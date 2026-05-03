import jwt from "jsonwebtoken";
import { exportJWK, importSPKI } from "jose";

/**
 * Decodes a base64 encoded string.
 * @param str - The base64 encoded string to decode.
 * @returns The decoded string.
 */
export const decodeBase64 = (str: string): string => {
  return Buffer.from(str, "base64").toString("utf8");
};

// Load RSA keys from environment variables (base64 encoded)
const privateKey = decodeBase64(process.env.JWT_PRIVATE_KEY || "");
const publicKey = decodeBase64(process.env.JWT_PUBLIC_KEY || "");

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
    expiresIn: "15m",
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

/**
 * Generates a JWK (JSON Web Key) from the provided PEM-encoded public key.
 * @param publicKeyPem - The PEM-encoded public key.
 * @returns The generated JWK.
 */
export const getPublicKeyJWK = async (publicKeyPem: string) => {
  const ecPublicKey = await importSPKI(publicKeyPem, "RS256");
  const jwk = await exportJWK(ecPublicKey);

  return {
    ...jwk,
    kid: "main-key",
    alg: "RS256",
    use: "sig",
  };
};
