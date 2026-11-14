import { AppError } from './error.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 'UNAUTHORIZED', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions for this resource.', 'FORBIDDEN', 403));
    }
    next();
  };
}
