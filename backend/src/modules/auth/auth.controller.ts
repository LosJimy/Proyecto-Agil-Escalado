import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { UserAlreadyExistsError } from "./auth.errors";

/**
 * Handles HTTP requests related to user authentication, including login, registration,
 * and token refreshing.
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Handles HTTP POST requests for user login (`/auth/login`). Validates the request
   * body, verifies credentials, and returns an access token and a refresh token.
   * @param {Request} req - The Express request object containing the login credentials
   * in the body (expects `email` and `password`).
   * @param {Response} res - The Express response object.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        res.status(400).json({ message: "Request body is required" });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const result = await this.authService.login(email, password);

      if (!result) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error in AuthController.login:", error);
      res.status(500).json({ message: "Oops, an unexpected error occurred" });
    }
  };

  /**
   * Handles HTTP POST requests for user registration (`/auth/register`). Validates the
   * request body, checks if the user already exists, and creates a new user account.
   * @param {Request} req - The Express request object containing the registration data
   * in the body (expects `email` and `password`).
   * @param {Response} res - The Express response object.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        res.status(400).json({ message: "Request body is required" });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: "Invalid email format" });
        return;
      }

      // At least 8 characters, must contain at least 1 uppercase letter, 1 lowercase
      // letter, and 1 number. Can contain special characters
      const passwordRegex =
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
      if (!passwordRegex.test(password)) {
        res.status(400).json({
          message:
            "Password must be at least 8 characters long and contain at least " +
            "1 uppercase letter, 1 lowercase letter, and 1 number",
        });
        return;
      }

      const result = await this.authService.register(email, password);
      res.status(201).json(result);
    } catch (error) {
      console.error("❌ Error in AuthController.register:", error);

      // TODO: Implement better error handling and logging
      if (error instanceof UserAlreadyExistsError) {
        res.status(409).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Oops, an unexpected error occurred" });
    }
  };

  /**
   * Handles HTTP POST requests for refreshing access tokens (`/auth/refresh`).
   * Validates the request body, verifies the refresh token, and returns a new access
   * token and refresh token if the provided refresh token is valid.
   * @param {Request} req - The Express request object containing the refresh token in
   * the body (expects `refreshToken`).
   * @param {Response} res - The Express response object.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        res.status(400).json({ message: "Invalid request body" });
        return;
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: "Refresh token is required" });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      if (!result) {
        res.status(401).json({ message: "Invalid or expired refresh token" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error in AuthController.refresh:", error);
      res.status(500).json({ message: "Oops, an unexpected error occurred" });
    }
  };
}
