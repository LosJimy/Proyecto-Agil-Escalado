import express from "express";
import { Client, Pool } from "pg";
import { AuthRepository } from "../../modules/auth/auth.repository";
import { AuthService } from "../../modules/auth/auth.service";
import { AuthController } from "../../modules/auth/auth.controller";
import { createAuthRoutes } from "../../modules/auth/auth.routes";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../../docs/swagger.json";
import { errorHandler } from "../middlewares/errorHandler";
import { logger } from "../utils/logger";
import { Request, Response } from "express";

export function createApp(query: Pool | Client) {
  const app = express();

  const authRepository = new AuthRepository(query);
  const authService = new AuthService(authRepository);
  const authController = new AuthController(authService);
  const authRoutes = createAuthRoutes(authController);

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

  return app;
}
