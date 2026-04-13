import jwt from "jsonwebtoken";
import fs from "node:fs";

const privateKey = fs.readFileSync("private.pem", "utf8");

const token = jwt.sign(
  { sub: "12345", email: "user@example.com", rol: "admin" },
  privateKey,
  { algorithm: "RS256", expiresIn: "1h" }
);

console.log("JWT firmado:", token);
