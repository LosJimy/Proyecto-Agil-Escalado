import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { UserAlreadyExistsError } from "./auth.errors";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        res.status(400).json({ message: "Invalid request body" });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const token = await this.authService.login(email, password);

      if (!token) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      res.status(200).json({ token });
    } catch (error) {
      console.error("❌ Error in AuthController.login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== "object") {
        res.status(400).json({ message: "Invalid request body" });
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

      const token = await this.authService.register(email, password);
      res.status(201).json({ token });
    } catch (error) {
      console.error("❌ Error in AuthController.register:", error);

      // TODO: Implement better error handling and logging
      if (error instanceof UserAlreadyExistsError) {
        res.status(409).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
