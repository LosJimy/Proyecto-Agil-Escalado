import jwt from "jsonwebtoken";
import fs from "node:fs";

const publicKey = fs.readFileSync("public.pem", "utf8");

// Pega aquí el token que generaste en sign-test.ts
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbCI6ImFkbWluIiwiaWF0IjoxNzc2MDQ2ODU3LCJleHAiOjE3NzYwNTA0NTd9.AV2yQ2XV37m7pTmNsHcwBIs4c2HinpA_cZvv2p1hgjBnToMM1MNSiMJSGbG6PIIeD6HgDy0XVZZIXkqqhzDOUtnLUA2M_G3lJlSjv0OQdTb9D2qtClK3vTM2-s4X6r-BEhaIwprItg7Z-OqlzzERCECFmHIpBRjgiRqlGvbx8wMLzscTeRoq7RexkimKxsjpMjraDzvisjiZIQCOwZ6a-mhrCByjkSDutHhcgYxO8Fxk8mFGZJ2gwgc_YM2YoYlkBAhoPtQF2mL4TCnFSC0gkfx6KpkI4xcNCWisvCPmA8u7skGjFb8D3ZOs8_X1JoypRIKZGjEY_JQ83K1nV_nu9g";

try {
  const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  console.log("Token válido:", decoded);
} catch (err) {
  console.error("Token inválido:", err);
}
