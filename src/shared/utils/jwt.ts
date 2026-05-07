import jwt, { SignOptions } from "jsonwebtoken";
import { exportJWK, importSPKI } from "jose";
import crypto from "crypto";
import { logger } from "./logger";

/**
 * Decodes a base64 encoded string.
 * @param str - The base64 encoded string to decode.
 * @returns The decoded string.
 */
export const decodeBase64 = (str: string): string => {
  return Buffer.from(str, "base64").toString("utf8");
};

// Keys in env are in base64 format
const fallbackPrivateKey = decodeBase64(process.env.JWT_PRIVATE_KEY || "");
const fallbackPublicKey = decodeBase64(process.env.JWT_PUBLIC_KEY || "");

if (!fallbackPrivateKey || !fallbackPublicKey) {
  logger.warn("JWT private and public keys are not set in .env file");
}

export const generateRSAKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const kid = crypto.randomBytes(16).toString("hex");

  return { kid, privateKey, publicKey };
};

export interface JWTPayload {
  sub: string;
  email: string;
  [key: string]: any;
}

export const signAccessToken = (
  payload: JWTPayload,
  privateKey: string = fallbackPrivateKey,
  kid: string = "main-key",
): string => {
  const options: SignOptions = {
    algorithm: "RS256",
    expiresIn: "15m",
    keyid: kid,
  };

  return jwt.sign(payload, privateKey, options);
};

export const verifyToken = async (
  token: string,
  keyOrResolver:
    | string
    | ((kid: string) => Promise<string | null>) = fallbackPublicKey,
): Promise<JWTPayload> => {
  if (typeof keyOrResolver === "string") {
    return jwt.verify(token, keyOrResolver, {
      algorithms: ["RS256"],
    }) as JWTPayload;
  }

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header.kid) {
    throw new Error("Token missing kid in header");
  }

  const publicKey = await keyOrResolver(decoded.header.kid);
  if (!publicKey) {
    throw new Error(`Public key not found for kid: ${decoded.header.kid}`);
  }

  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
  }) as JWTPayload;
};

export const getPublicKeyJWK = async (
  publicKeyPem: string,
  kid: string = "main-key",
) => {
  const ecPublicKey = await importSPKI(publicKeyPem, "RS256");
  const jwk = await exportJWK(ecPublicKey);

  return {
    ...jwk,
    kid,
    alg: "RS256",
    use: "sig",
  };
};
