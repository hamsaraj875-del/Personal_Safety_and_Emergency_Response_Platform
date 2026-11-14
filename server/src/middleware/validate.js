import { AppError } from './error.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return next(new AppError(`Validation failed: ${messages}`, 'VALIDATION_ERROR', 400));
    }
    req[source] = result.data;
    next();
  };
}
