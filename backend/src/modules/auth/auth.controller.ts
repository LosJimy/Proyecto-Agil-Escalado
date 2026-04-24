import { Request, Response } from "express";
import jwt from "jsonwebtoken";
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

  publicKey = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        key: process.env.JWT_PUBLIC_KEY,
        kid: process.env.JWT_KEY_ID || "default"
      });
    } catch (error) {
      console.error("❌ Error in AuthController.publicKey:", error);
      res.status(500).json({message: "Internal server error"});
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const oldToken = req.headers.authorization?.split(" ")[1];
      if(!oldToken) {
        res.status(400).json({message: "Missing token"});
        return;
      }

      const payload = jwt.verify(oldToken, process.env.JWT_PUBLIC_KEY as string);

      const newToken = jwt.sign(
        {sub: (payload as any).sub},
        process.env.JWT_PRIVATE_KEY as string,
        {algorithm: "RS256", expiresIn: "15m"}
      );

      res.status(200).json({token: newToken});
    } catch (error) {
      console.error("❌ Error in AuthController.refresh:", error);
      res.status(400).json({message: "Invalid or expired token"});
    }
  };
}
