import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";
import { LOGS_MESSAGES } from "../constants/logsMessages";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    logger.warn(
      `${LOGS_MESSAGES.ERRORS.GLOBAL.CLIENT_ERROR} [${err.statusCode}]: ${err.message}`,
    );

    return res.status(err.statusCode).json({
      status: "fail",
      message: err.message,
    });
  }

  logger.error(
    `${LOGS_MESSAGES.ERRORS.GLOBAL.CRITICAL_ERROR}: ${err.message}\nStack: ${err.stack}`,
    err,
  );

  return res.status(500).json({
    status: "error",
    message: LOGS_MESSAGES.ERRORS.GLOBAL.INTERNAL_SERVER_ERROR,
  });
};
