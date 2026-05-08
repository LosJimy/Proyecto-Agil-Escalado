import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { AppError } from "../../shared/errors/AppError";

export interface GetProfileResponse {
  id: string;
  email: string;
  is_active: boolean;
}

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  requestAccountDeactivation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return next(new AppError("Request body is required", 400));
      }

      const { email } = req.body;
      if (!email) {
        return next(new AppError("Email is required", 400));
      }

      const result = await this.usersService.requestAccountDeactivation(email);
      if (result) {
        res
          .status(200)
          .json({ message: "Deactivation code sent to your email" });
      } else {
        return next(new AppError("Invalid credentials", 401));
      }
    } catch (error) {
      next(error);
    }
  };

  confirmAccountDeactivation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return next(new AppError("Request body is required", 400));
      }

      const { email, otp } = req.body;
      if (!email || !otp) {
        return next(new AppError("Email and code are required", 400));
      }

      const result = await this.usersService.confirmDeactivationWithOtp(
        email,
        otp,
      );
      if (result) {
        res.status(200).json({ message: "Account deactivated successfully" });
      } else {
        return next(new AppError("Invalid credentials or code", 401));
      }
    } catch (error) {
      next(error);
    }
  };
}
