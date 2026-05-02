import express, { Request, Response } from "express";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json" with { type: "json" };
import { errorHandler } from "./shared/middlewares/errorHandler";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/auth", authRoutes);
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: ":)" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Backend listening on port ${port}`);
});
