import { Router } from "express";
import { UsersController } from "./users.controller";

export function createUsersRoutes(controller: UsersController): Router {
  const router = Router();

  router.post("/deactivate", controller.deactivateAccount);

  return router;
}
