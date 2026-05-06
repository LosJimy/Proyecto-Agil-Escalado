import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { OtpService } from "./otp.service";
import { AppError } from "../../shared/errors/AppError";
import { LOGS_MESSAGES } from "../../shared/constants/logsMessages";

/**
 * Handles HTTP requests related to user authentication, including login, registration,
 * token refreshing, and passwordless OTP authentication.
 */
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Handles HTTP POST requests for user login (`/auth/login`). Validates the request
   * body, verifies credentials, and returns an access token and a refresh token.
   * @param {Request} req - The Express request object containing the login credentials
   * in the body (expects `email` and `password`).
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next function for error handling.
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_BODY;
        return next(new AppError(message, statusCode));
      }

      const { email, password } = req.body;

      if (!email || !password) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.MISSING_EMAIL_PASSWORD;
        return next(new AppError(message, statusCode));
      }

      const result = await this.authService.login(email, password);

      if (!result) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_CREDENTIALS;
        return next(new AppError(message, statusCode));
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles HTTP POST requests for user logout (`/auth/logout`). Validates the request
   * body, verifies the refresh token, and revokes it if valid.
   * @param req The Express request object containing the refresh token in the body
   * (expects `refreshToken`).
   * @param res The Express response object.
   * @param next The Express next function for error handling.
   * @returns A promise that resolves when the response is sent.
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_BODY;
        return next(new AppError(message, statusCode));
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.MISSING_REFRESH_TOKEN;
        return next(new AppError(message, statusCode));
      }

      const result = await this.authService.logout(refreshToken);
      if (result) {
        res.status(200).json({ message: "Logged out successfully" });
      } else {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_REFRESH_TOKEN;
        return next(new AppError(message, statusCode));
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles HTTP POST requests for user registration (`/auth/register`). Validates the
   * request body, checks if the user already exists, and creates a new user account.
   * @param {Request} req - The Express request object containing the registration data
   * in the body (expects `email` and `password`).
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next function for error handling.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_BODY;
        return next(new AppError(message, statusCode));
      }

      const { email, password } = req.body;

      if (!email || !password) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.MISSING_EMAIL_PASSWORD;
        return next(new AppError(message, statusCode));
      }

      const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi;
      if (!emailRegex.test(email)) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.WRONG_EMAIL_FORMAT;
        return next(new AppError(message, statusCode));
      }

      // At least 8 characters, must contain at least 1 uppercase letter, 1 lowercase
      // letter, and 1 number. Can contain special characters
      const passwordRegex =
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
      if (!passwordRegex.test(password)) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.WRONG_PASSWORD_FORMAT;
        return next(new AppError(message, statusCode));
      }

      const result = await this.authService.register(email, password);
      if (!result) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.USER_ALREADY_EXISTS;
        return next(new AppError(message, statusCode));
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles HTTP POST requests for refreshing access tokens (`/auth/refresh`).
   * Validates the request body, verifies the refresh token, and returns a new access
   * token and refresh token if the provided refresh token is valid.
   * @param {Request} req - The Express request object containing the refresh token in
   * the body (expects `refreshToken`).
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next function for error handling.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_BODY;
        return next(new AppError(message, statusCode));
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.MISSING_REFRESH_TOKEN;
        return next(new AppError(message, statusCode));
      }

      const result = await this.authService.refreshToken(refreshToken);

      if (!result) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_REFRESH_TOKEN;
        return next(new AppError(message, statusCode));
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles HTTP GET requests for retrieving the JSON Web Key Set (JWKS) containing the
   * public key used for verifying JWTs.
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next function for error handling.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
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

  /**
   * Handles HTTP POST requests for requesting a passwordless OTP (`/auth/otp/request`).
   * Validates the email, generates an OTP, and returns it (dev mode).
   * @param {Request} req - The Express request object containing the email in the body.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next function for error handling.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  requestOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_BODY;
        return next(new AppError(message, statusCode));
      }

      const { email } = req.body;

      if (!email) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.MISSING_EMAIL;
        return next(new AppError(message, statusCode));
      }

      const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi;
      if (!emailRegex.test(email)) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.WRONG_EMAIL_FORMAT;
        return next(new AppError(message, statusCode));
      }

      const result = await this.otpService.requestOtp(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles HTTP POST requests for verifying a passwordless OTP (`/auth/otp/verify`).
   * Validates the email and OTP code, verifies them, and returns tokens if valid.
   * @param {Request} req - The Express request object containing email and otp in body.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next function for error handling.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_BODY;
        return next(new AppError(message, statusCode));
      }

      const { email, otp } = req.body;

      if (!email || !otp) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.MISSING_EMAIL_OTP;
        return next(new AppError(message, statusCode));
      }

      const result = await this.otpService.verifyOtp(email, otp);

      if (!result) {
        const { message, statusCode } =
          LOGS_MESSAGES.ERRORS.AUTH.CONTROLLER.INVALID_OTP;
        return next(new AppError(message, statusCode));
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

