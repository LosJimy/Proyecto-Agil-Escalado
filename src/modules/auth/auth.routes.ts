import { Router } from "express";
import { AuthController } from "./auth.controller";

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();
  router.post("/login", controller.login);
  router.post("/logout", controller.logout);
  router.post("/register", controller.register);
  router.post("/refresh", controller.refresh);
  router.get("/.well-known/jwks.json", controller.getJwks);
  return router;
}
