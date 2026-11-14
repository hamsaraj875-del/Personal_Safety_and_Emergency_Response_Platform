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
import { Responder } from '../models/Responder.js';

const router = express.Router();
const otpChallenges = new Map();

router.post('/auth/otp/request', authLimiter, async (req, res, next) => {
  try {
    const phone = normalizePhone(String(req.body.phone || ''));
    if (phone.length < 8) throw new AppError('A valid phone number is required.', 'VALIDATION_ERROR', 400);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpChallenges.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    res.json({ success: true, ...(env.DEMO_MODE ? { code } : {}) });
  } catch (err) { next(err); }
});

router.post('/auth/otp/verify', authLimiter, async (req, res, next) => {
  try {
    const phone = normalizePhone(String(req.body.phone || ''));
    const challenge = otpChallenges.get(phone);
    if (!challenge || challenge.expiresAt < Date.now() || challenge.code !== String(req.body.code || '')) throw new AppError('Invalid or expired OTP.', 'INVALID_OTP', 401);
    otpChallenges.delete(phone);
    let user = await User.findOne({ phoneNormalized: phone });
    if (!user) {
      user = await User.create({ name: String(req.body.name || 'Citizen').trim() || 'Citizen', phone: String(req.body.phone), phoneNormalized: phone, passwordHash: await bcrypt.hash(jwt.sign({ phone, at: Date.now() }, env.JWT_SECRET), 10), address: req.body.address || undefined, pinsSet: false });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, env.JWT_SECRET, { expiresIn: '7d' });
    const userJson = user.toJSON();
    for (const field of ['passwordHash', 'safetyPinHash', 'duressPinHash']) delete userJson[field];
    res.json({ token, user: userJson });
  } catch (err) { next(err); }
});

router.post('/auth/responder/login', authLimiter, async (req, res, next) => {
  try {
    const phone = normalizePhone(String(req.body.phone || ''));
    const responder = await Responder.findOne({ phone });
    if (!responder || !responder.passwordHash || !(await bcrypt.compare(String(req.body.password || ''), responder.passwordHash))) throw new AppError('Invalid responder credentials.', 'INVALID_CREDENTIALS', 401);
    const token = jwt.sign({ id: responder.id, role: 'responder', name: responder.name }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, responder });
  } catch (err) { next(err); }
});

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

    const user = await User.create({
      name,
      phone,
      phoneNormalized,
      email: email ? email.toLowerCase() : undefined,
      passwordHash,
      pinsSet: false,
      role: 'citizen'
    });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, env.JWT_SECRET, {
      expiresIn: '7d'
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
      expiresIn: '7d'
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
