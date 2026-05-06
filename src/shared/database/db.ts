import { Pool } from "pg";
import dotenv from "dotenv";
import { logger } from "../utils/logger";
import { LOGS_MESSAGES } from "../constants/logsMessages";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  logger.info(LOGS_MESSAGES.INFO.DB.CONNECTED);
});

pool.on("error", (err) => {
  logger.error(`${LOGS_MESSAGES.ERRORS.DB.CONNECTION_ERROR}: ${err.message}`);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
