import express from "express";
import { Client, Pool } from "pg";
import { AuthRepository } from "../../modules/auth/auth.repository";
import { JwtKeyRepository } from "../../modules/auth/jwt-key.repository";
import { AuthService } from "../../modules/auth/auth.service";
import { OtpService } from "../../modules/auth/otp.service";
import { AuthController } from "../../modules/auth/auth.controller";
import { createAuthRoutes } from "../../modules/auth/auth.routes";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../../docs/swagger.json";
import { errorHandler } from "../middlewares/errorHandler";
import { logger } from "../utils/logger";
import { EmailService } from "../utils/email";
import { Request, Response } from "express";

export function createApp(query: Pool | Client) {
  const app = express();

  const authRepository = new AuthRepository(query);
  const jwtKeyRepository = new JwtKeyRepository(query);
  const authService = new AuthService(authRepository, jwtKeyRepository);
  const emailService = new EmailService();
  const otpService = new OtpService(authRepository, authService, emailService);
  const authController = new AuthController(authService, otpService);
  const authRoutes = createAuthRoutes(authController);

  app.use(express.json());
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/auth", authRoutes);

  app.use((req, res, next) => {
    logger.http(`${req.method} ${req.url}`);
    next();
  });
  app.use(errorHandler);

  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: ":) hola" });
  });

  return app;
}
