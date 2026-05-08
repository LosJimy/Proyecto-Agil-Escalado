import dotenv from "dotenv";
import { logger } from "./shared/utils/logger";
import pool from "./shared/database/db";
import { createApp } from "./shared/factories/app-factory";

dotenv.config();

const app = createApp(pool);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  logger.info(`Server started on port ${port}`);
});
