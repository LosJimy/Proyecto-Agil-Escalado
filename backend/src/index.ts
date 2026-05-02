import express, { Request, Response } from "express";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json" with { type: "json" };
import { errorHandler } from "./shared/middlewares/errorHandler";
import { logger } from "./shared/utils/logger";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
// Serve API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/auth", authRoutes);

// Log all incoming requests
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});
// Global error handling middleware
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: ":)" });
});

app.listen(port, "0.0.0.0", () => {
  logger.info(`Backend listening on port ${port}`);
});
