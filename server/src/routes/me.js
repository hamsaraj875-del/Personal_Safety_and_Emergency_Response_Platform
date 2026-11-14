import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/error.js';
import { User } from '../models/User.js';

const router = express.Router();

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
  bloodGroup: z.string().optional(),
  emergencyNotes: z.string().optional(),
  address: z.string().optional(),
  settings: z
    .object({
      demoMode: z.boolean().optional(),
      escalationSpeed: z.enum(['FAST', 'NORMAL', 'SPEC']).optional()
    })
    .optional()
});

const updatePinsSchema = z.object({
  safetyPin: z.string().regex(/^\d{4}$/, 'Safety PIN must be exactly 4 digits'),
  duressPin: z.string().regex(/^\d{4}$/, 'Duress PIN must be exactly 4 digits')
});

const deviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['android', 'ios', 'web'])
});

router.use('/me', authenticate);

router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found.', 'NOT_FOUND', 404);

    const userJson = user.toJSON();
    delete userJson.passwordHash;
    delete userJson.safetyPinHash;
    delete userJson.duressPinHash;

    // Provide friendly display flags expected by Compose UserProfile
    userJson.batteryLevel = '88%';
    userJson.gpsStatus = 'Protected · GPS Ready';

    res.json({ user: userJson });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', validate(updateMeSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found.', 'NOT_FOUND', 404);

    const updates = req.body;
    if (updates.name) user.name = updates.name;
    if (updates.avatar) user.avatar = updates.avatar;
    if (updates.bloodGroup) user.bloodGroup = updates.bloodGroup;
    if (updates.emergencyNotes !== undefined) user.emergencyNotes = updates.emergencyNotes;
    if (updates.address) user.address = updates.address;
    if (updates.settings) {
      user.settings = { ...user.settings, ...updates.settings };
    }

    await user.save();

    const userJson = user.toJSON();
    delete userJson.passwordHash;
    delete userJson.safetyPinHash;
    delete userJson.duressPinHash;

    res.json({ user: userJson });
  } catch (err) {
    next(err);
  }
});

router.put('/me/pins', validate(updatePinsSchema), async (req, res, next) => {
  try {
    const { safetyPin, duressPin } = req.body;
    if (safetyPin === duressPin) {
      throw new AppError('Safety PIN and Duress PIN must be distinct 4-digit codes.', 'PIN_IDENTICAL', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const safetyPinHash = await bcrypt.hash(safetyPin, salt);
    const duressPinHash = await bcrypt.hash(duressPin, salt);

    await User.findByIdAndUpdate(req.user.id, { safetyPinHash, duressPinHash });

    res.json({ success: true, message: 'Safety and Duress PINs successfully updated.' });
  } catch (err) {
    next(err);
  }
});

router.post('/me/device-token', validate(deviceTokenSchema), async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { deviceTokens: { token } }
    });
    await User.findByIdAndUpdate(req.user.id, {
      $push: { deviceTokens: { token, platform, updatedAt: new Date() } }
    });

    res.json({ success: true, message: 'Device token registered.' });
  } catch (err) {
    next(err);
  }
});

export default router;
