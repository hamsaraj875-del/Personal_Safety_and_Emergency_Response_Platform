export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message
    }
  });
}

export class AppError extends Error {
  constructor(message, code = 'BAD_REQUEST', statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
