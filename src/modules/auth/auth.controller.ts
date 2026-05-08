import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { OtpService } from "./otp.service";
import { AppError } from "../../shared/errors/AppError";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return next(new AppError("Request body is required", 400));
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return next(new AppError("Email and password are required", 400));
      }

      const result = await this.authService.login(email, password);

      if (!result) {
        return next(new AppError("Invalid credentials", 401));
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return next(new AppError("Request body is required", 400));
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(new AppError("Refresh token is required", 400));
      }

      const result = await this.authService.logout(refreshToken);
      if (result) {
        res.status(200).json({ message: "Logged out successfully" });
      } else {
        return next(new AppError("Invalid refresh token", 401));
      }
    } catch (error) {
      next(error);
    }
  };

  register = async (
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
        return next(new AppError("Wrong email format", 400));
      }

      // At least 8 characters, must contain at least 1 uppercase letter, 1 lowercase
      // letter, and 1 number. Can contain special characters
      const passwordRegex =
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
      if (!passwordRegex.test(password)) {
        return next(new AppError("Wrong password format", 400));
      }

      const result = await this.authService.register(email, password);
      if (!result) {
        return next(new AppError("User already exists", 409));
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return next(new AppError("Request body is required", 400));
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(new AppError("Refresh token is required", 400));
      }

      const result = await this.authService.refreshToken(refreshToken);

      if (!result) {
        return next(new AppError("Invalid refresh token", 401));
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getJwks = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const jwks = await this.authService.getJwks();
      res.status(200).json(jwks);
    } catch (error) {
      next(error);
    }
  };

  requestOtp = async (
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

      const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi;
      if (!emailRegex.test(email)) {
        return next(new AppError("Wrong email format", 400));
      }

      const result = await this.otpService.requestOtp(email);
      if (result) {
        res.status(200).json({
          message: "OTP sent successfully at the given email",
        });
      }
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (
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
        return next(new AppError("Email and OTP are required", 400));
      }

      const result = await this.otpService.verifyOtp(email, otp);

      if (!result) {
        return next(new AppError("Invalid or expired OTP code", 401));
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
