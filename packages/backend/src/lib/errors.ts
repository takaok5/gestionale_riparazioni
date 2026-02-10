interface ErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ErrorResponse {
  error: ErrorBody;
}

function buildErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  if (details) {
    return { error: { code, message, details } };
  }

  return { error: { code, message } };
}

export { buildErrorResponse, type ErrorResponse };
