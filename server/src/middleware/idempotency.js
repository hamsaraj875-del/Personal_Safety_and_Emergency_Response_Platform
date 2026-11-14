import { IdempotencyKey } from '../models/IdempotencyKey.js';

export function idempotency() {
  return async (req, res, next) => {
    const key = req.headers['idempotency-key'];
    if (!key) return next();

    try {
      const existing = await IdempotencyKey.findOne({ key });
      if (existing) {
        return res.status(existing.statusCode).json(existing.response);
      }

      // Intercept json response to cache it
      const originalJson = res.json.bind(res);
      res.json = body => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          IdempotencyKey.create({
            key,
            statusCode: res.statusCode,
            response: body
          }).catch(err => console.error('Failed to save idempotency key:', err.message));
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}
