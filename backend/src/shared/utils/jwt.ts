import jwt from "jsonwebtoken";

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

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as JWTPayload;
};
