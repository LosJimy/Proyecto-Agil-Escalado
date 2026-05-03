export const ERROR_MESSAGES = {
  AUTH: {
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
} as const;
