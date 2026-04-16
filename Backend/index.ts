import express, { Request, Response } from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);

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
