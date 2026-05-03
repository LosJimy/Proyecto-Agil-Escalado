import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    logger.warn(`Client Error [${err.statusCode}]: ${err.message}`);

    return res.status(err.statusCode).json({
      status: "fail",
      message: err.message,
    });
  }

  logger.error(`Critical Error: ${err.message}\nStack: ${err.stack}`, err);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
