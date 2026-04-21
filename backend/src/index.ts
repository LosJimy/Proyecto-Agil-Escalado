import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./modules/auth/auth.routes";

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const app = express();
const port = Number(process.env.BACKEND_PORT ?? 3000);

// Middlewares
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ service: "backend", status: "running" });
});

app.get("/api", (_req: Request, res: Response) => {
  res.status(200).json({ service: "backend", status: "running" });
});

app.listen(port, () => {
  console.log(`Servidor iniciado en puerto ${port}`);
});
