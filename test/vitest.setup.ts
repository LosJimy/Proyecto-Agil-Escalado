import dotenv from "dotenv";
import { logger } from "../src/shared/utils/logger";

dotenv.config({ path: ".env.test" });

logger.transports.forEach((t) => (t.silent = true));
