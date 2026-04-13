import { generateKeyPairSync } from "crypto";
import fs from "fs";

// Generar par de claves RSA 2048 bits
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
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

// Guardar en archivos .pem
fs.writeFileSync("private.pem", privateKey);
fs.writeFileSync("public.pem", publicKey);

console.log("Claves generadas: private.pem y public.pem");
