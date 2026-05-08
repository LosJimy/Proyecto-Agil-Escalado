import { Router } from "express";
import { UsersController } from "./users.controller";

export function createUsersRoutes(controller: UsersController): Router {
  const router = Router();

  router.post("/deactivate", controller.requestAccountDeactivation);
  router.post("/deactivate/confirm", controller.confirmAccountDeactivation);

  return router;
}
