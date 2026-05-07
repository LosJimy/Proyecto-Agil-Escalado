import { Pool } from "pg";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "postgresql://postgres:postgres@localhost:5432/postgres",
});

pool.on("connect", () => {
  logger.info("Database connected");
});

pool.on("error", (err) => {
  logger.error(`Database connection error: ${err.message}`);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
