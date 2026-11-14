import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './error.js';
import { User } from '../models/User.js';
import { AuthorityOfficer } from '../models/AuthorityOfficer.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization header missing or invalid.', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (decoded.role === 'authority') {
      const officer = await AuthorityOfficer.findById(decoded.id);
      if (!officer) {
        throw new AppError('Authority officer account not found.', 'UNAUTHORIZED', 401);
      }
      req.user = {
        id: officer.id,
        badgeId: officer.badgeId,
        name: officer.name,
        sector: officer.sector,
        role: 'authority'
      };
    } else {
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new AppError('User not found or deactivated.', 'UNAUTHORIZED', 401);
      }
      req.user = user;
    }

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired authentication token.', 'UNAUTHORIZED', 401));
    }
    next(err);
  }
}
