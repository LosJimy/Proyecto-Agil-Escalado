// Here should be defined all the log messages used in the application
export const LOGS_MESSAGES = {
  ERRORS: {
    AUTH: {
      // These messages should have an HTTP status code associated with them
      CONTROLLER: {
        INVALID_BODY: {
          message: "Request body is required",
          statusCode: 400,
        },
        MISSING_EMAIL_PASSWORD: {
          message: "Email and password are required",
          statusCode: 400,
        },
        MISSING_REFRESH_TOKEN: {
          message: "Refresh token is required",
          statusCode: 400,
        },
        INVALID_REFRESH_TOKEN: {
          message: "Invalid or already revoked refresh token",
          statusCode: 400,
        },
        INVALID_CREDENTIALS: {
          message: "Invalid credentials",
          statusCode: 401,
        },
        WRONG_EMAIL_FORMAT: {
          message: "Invalid email format",
          statusCode: 400,
        },
        WRONG_PASSWORD_FORMAT: {
          message: "Password does not meet complexity requirements",
          statusCode: 400,
        },
        USER_ALREADY_EXISTS: {
          message: "User already exists",
          statusCode: 409,
        },
      },
      SERVICE: {
        NON_EXISTENT_TOKEN:
          "Attempted to revoke non-existent or already revoked token",
        JWT_PUBLIC_KEY_NOT_SET:
          "JWT public key is not set in environment variables",
      },
    },
    DB: {
      CONNECTION_ERROR: "Database connection error",
    },
    GLOBAL: {
      INTERNAL_SERVER_ERROR: "Internal server error",
      CLIENT_ERROR: "Client error",
      CRITICAL_ERROR: "Critical error",
    },
    UTILS: {
      JWT_KEYS_NOT_SET: "JWT keys are not set in environment variables",
    },
  },
  INFO: {
    DB: {
      CONNECTED: "Connected to PostgreSQL database",
    },
    APP: {
      LISTENING: (port: number) => `Server is running on port ${port}`,
    },
  },
} as const;
