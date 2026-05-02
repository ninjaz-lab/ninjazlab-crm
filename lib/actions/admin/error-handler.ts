/**
 * Admin action error handling
 * Standardized error class and utilities for admin server actions
 */

/**
 * Custom error class for admin actions
 * Includes error code and HTTP status for proper error reporting
 */
export class AdminActionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AdminActionError";
  }
}

/**
 * Predefined error codes for admin actions
 */
export const ADMIN_ERROR_CODES = {
  // Validation errors (400)
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_ROLE: "INVALID_ROLE",
  INVALID_PRICE: "INVALID_PRICE",
  INVALID_CONFIG: "INVALID_CONFIG",
  DUPLICATE_RULE: "DUPLICATE_RULE",

  // Not found errors (404)
  USER_NOT_FOUND: "USER_NOT_FOUND",
  TRANSACTION_NOT_FOUND: "TRANSACTION_NOT_FOUND",
  RULE_NOT_FOUND: "RULE_NOT_FOUND",
  PROVIDER_NOT_FOUND: "PROVIDER_NOT_FOUND",
  WALLET_NOT_FOUND: "WALLET_NOT_FOUND",

  // State errors (409)
  INVALID_TRANSACTION_STATUS: "INVALID_TRANSACTION_STATUS",
  PROVIDER_IN_USE: "PROVIDER_IN_USE",
  CANNOT_DEMOTE_SELF: "CANNOT_DEMOTE_SELF",
  RULE_ALREADY_EXISTS: "RULE_ALREADY_EXISTS",

  // Permission errors (403)
  INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Server errors (500)
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * Error status code mapping
 */
const ERROR_STATUS_CODES: Record<string, number> = {
  INVALID_INPUT: 400,
  INVALID_ROLE: 400,
  INVALID_PRICE: 400,
  INVALID_CONFIG: 400,
  DUPLICATE_RULE: 409,
  USER_NOT_FOUND: 404,
  TRANSACTION_NOT_FOUND: 404,
  RULE_NOT_FOUND: 404,
  PROVIDER_NOT_FOUND: 404,
  WALLET_NOT_FOUND: 404,
  INVALID_TRANSACTION_STATUS: 409,
  PROVIDER_IN_USE: 409,
  CANNOT_DEMOTE_SELF: 409,
  RULE_ALREADY_EXISTS: 409,
  INSUFFICIENT_PERMISSION: 403,
  UNAUTHORIZED: 403,
  DATABASE_ERROR: 500,
  EXTERNAL_SERVICE_ERROR: 503,
  UNKNOWN_ERROR: 500,
};

/**
 * Get HTTP status code for error code
 */
export function getErrorStatusCode(code: string): number {
  return ERROR_STATUS_CODES[code] || 500;
}

/**
 * Format error for response
 * Ensures consistent error response structure
 */
export function formatAdminError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
} {
  if (error instanceof AdminActionError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: ADMIN_ERROR_CODES.UNKNOWN_ERROR,
      statusCode: 500,
    };
  }

  return {
    message: "An unexpected error occurred",
    code: ADMIN_ERROR_CODES.UNKNOWN_ERROR,
    statusCode: 500,
  };
}

/**
 * Validate non-null value and throw if null
 */
export function validateExists<T>(
  value: T | null | undefined,
  entityName: string,
  entityId?: string
): asserts value is T {
  if (!value) {
    throw new AdminActionError(
      entityId
        ? `${entityName} with ID ${entityId} not found`
        : `${entityName} not found`,
      ADMIN_ERROR_CODES.USER_NOT_FOUND,
      404
    );
  }
}

/**
 * Validate condition and throw if false
 */
export function validateCondition(
  condition: boolean,
  message: string,
  code: string = ADMIN_ERROR_CODES.INVALID_INPUT
): asserts condition {
  if (!condition) {
    throw new AdminActionError(message, code, getErrorStatusCode(code));
  }
}

/**
 * Safe async operation wrapper with consistent error handling
 */
export async function executeAdminAction<T>(
  operation: () => Promise<T>,
  fallbackError: string = "Operation failed"
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AdminActionError) {
      throw error;
    }

    console.error("Unexpected error in admin action:", error);

    throw new AdminActionError(
      fallbackError,
      ADMIN_ERROR_CODES.UNKNOWN_ERROR,
      500
    );
  }
}
