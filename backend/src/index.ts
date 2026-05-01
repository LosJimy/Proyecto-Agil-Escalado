import express, { Request, Response } from "express";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json" with { type: "json" };

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic logging middleware for incoming requests
app.use((req: Request, res: Response, next) => {
  console.log(`📩 New request: ${req.method} ${req.originalUrl || req.url}`);
  next();
});

app.use("/auth", authRoutes);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: ":)" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Backend listening on port ${port}`);
});
