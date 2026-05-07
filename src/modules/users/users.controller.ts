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

  deactivateAccount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return next(new AppError("Request body is required", 400));
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return next(new AppError("Email and password are required", 400));
      }

      const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi;
      if (!emailRegex.test(email)) {
        return next(new AppError("Invalid email format", 400));
      }

      const passwordRegex =
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
      if (!passwordRegex.test(password)) {
        return next(new AppError("Invalid password format", 400));
      }

      await this.usersService.deactivateAccount(email, password);

      res.status(200).json({ message: "Account deactivated successfully" });
    } catch (error) {
      next(error);
    }
  };
}
