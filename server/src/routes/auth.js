import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AuthorityOfficer } from '../models/AuthorityOfficer.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/error.js';
import { normalizePhone } from '../utils/phone.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(1)
});

const authorityLoginSchema = z.object({
  badgeId: z.string().min(3),
  password: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional()
});

router.post('/auth/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;
    const phoneNormalized = normalizePhone(phone);

    const existingUser = await User.findOne({
      $or: [{ phoneNormalized }, ...(email ? [{ email: email.toLowerCase() }] : [])]
    });

    if (existingUser) {
      throw new AppError('An account with this phone or email already exists.', 'USER_EXISTS', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const safetyPinHash = await bcrypt.hash('1234', salt);
    const duressPinHash = await bcrypt.hash('9999', salt);

    const user = await User.create({
      name,
      phone,
      phoneNormalized,
      email: email ? email.toLowerCase() : undefined,
      passwordHash,
      safetyPinHash,
      duressPinHash,
      role: 'citizen'
    });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, env.JWT_SECRET, {
      expiresIn: '30d'
    });

    const userJson = user.toJSON();
    delete userJson.passwordHash;
    delete userJson.safetyPinHash;
    delete userJson.duressPinHash;

    res.status(201).json({ token, user: userJson });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;
    const phoneNormalized = normalizePhone(emailOrPhone);

    const user = await User.findOne({
      $or: [{ phoneNormalized }, { email: emailOrPhone.toLowerCase() }]
    });

    if (!user) {
      throw new AppError('Invalid credentials.', 'INVALID_CREDENTIALS', 401);
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new AppError('Invalid credentials.', 'INVALID_CREDENTIALS', 401);
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, env.JWT_SECRET, {
      expiresIn: '30d'
    });

    const userJson = user.toJSON();
    delete userJson.passwordHash;
    delete userJson.safetyPinHash;
    delete userJson.duressPinHash;

    res.json({ token, user: userJson });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/authority/login', authLimiter, validate(authorityLoginSchema), async (req, res, next) => {
  try {
    const { badgeId, password } = req.body;

    const officer = await AuthorityOfficer.findOne({ badgeId: badgeId.trim().toUpperCase() });
    if (!officer) {
      throw new AppError('Invalid authority badge ID or password.', 'INVALID_CREDENTIALS', 401);
    }

    const match = await bcrypt.compare(password, officer.passwordHash);
    if (!match) {
      throw new AppError('Invalid authority badge ID or password.', 'INVALID_CREDENTIALS', 401);
    }

    const token = jwt.sign(
      { id: officer.id, badgeId: officer.badgeId, role: 'authority', sector: officer.sector },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const officerJson = officer.toJSON();
    delete officerJson.passwordHash;

    res.json({ token, officer: officerJson });
  } catch (err) {
    next(err);
  }
});

export default router;
