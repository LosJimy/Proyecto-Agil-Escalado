import dotenv from "dotenv";
import pool from "../shared/database/db";
import { AuthRepository } from "../modules/auth/auth.repository";
import { JwtKeyRepository } from "../modules/auth/jwt-key.repository";
import { AuthService } from "../modules/auth/auth.service";
import { logger } from "../shared/utils/logger";

dotenv.config();

async function runRotation() {
  logger.info("Starting manual JWT key rotation...");

  try {
    const authRepository = new AuthRepository(pool);
    const jwtKeyRepository = new JwtKeyRepository(pool);
    const authService = new AuthService(authRepository, jwtKeyRepository);

    await authService.rotateKeys();

    const latestKey = await jwtKeyRepository.getLatestActiveKey();
    if (latestKey) {
      logger.info(
        `Key rotation successful. New Key ID (kid): ${latestKey.kid}`,
      );
    } else {
      logger.error("Key rotation completed but no key was found in database.");
    }
  } catch (error) {
    logger.error("Key rotation failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runRotation();
