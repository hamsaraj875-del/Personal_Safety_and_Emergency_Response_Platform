import express from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/error.js';
import { Contact } from '../models/Contact.js';

const router = express.Router();
router.use(authenticate);

const createContactSchema = z.object({
  name: z.string().min(2),
  relation: z.string().min(2),
  phone: z.string().min(8),
  priority: z.number().int().min(1).max(5).optional(),
  avatar: z.string().url().optional(),
  consentGiven: z.boolean().default(true)
});

const updateContactSchema = z.object({
  name: z.string().min(2).optional(),
  relation: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  avatar: z.string().url().optional(),
  status: z.string().optional()
});

const reorderSchema = z.object({
  ids: z.array(z.string()).min(1).max(5)
});

router.get('/contacts', async (req, res, next) => {
  try {
    const contacts = await Contact.find({ userId: req.user.id }).sort({ priority: 1 });
    res.json({ contacts });
  } catch (err) {
    next(err);
  }
});

router.post('/contacts', validate(createContactSchema), async (req, res, next) => {
  try {
    const count = await Contact.countDocuments({ userId: req.user.id });
    if (count >= 5) {
      throw new AppError('Maximum limit of 5 trusted emergency contacts reached.', 'CONTACT_LIMIT', 400);
    }

    const { name, relation, phone, priority, avatar, consentGiven } = req.body;
    const finalPriority = priority || count + 1;

    const contact = await Contact.create({
      userId: req.user.id,
      name,
      relation,
      phone,
      priority: finalPriority,
      avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      consentGiven: consentGiven !== undefined ? consentGiven : true,
      status: 'Active'
    });

    res.status(201).json({ contact });
  } catch (err) {
    next(err);
  }
});

router.patch('/contacts/:id', validate(updateContactSchema), async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, userId: req.user.id });
    if (!contact) throw new AppError('Contact not found.', 'NOT_FOUND', 404);

    Object.assign(contact, req.body);
    await contact.save();

    res.json({ contact });
  } catch (err) {
    next(err);
  }
});

router.delete('/contacts/:id', async (req, res, next) => {
  try {
    const result = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) throw new AppError('Contact not found.', 'NOT_FOUND', 404);

    // Re-sequence remaining priorities
    const remaining = await Contact.find({ userId: req.user.id }).sort({ priority: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].priority = i + 1;
      await remaining[i].save();
    }

    res.json({ success: true, message: 'Contact removed successfully.' });
  } catch (err) {
    next(err);
  }
});

router.put('/contacts/reorder', validate(reorderSchema), async (req, res, next) => {
  try {
    const { ids } = req.body;
    for (let i = 0; i < ids.length; i++) {
      await Contact.findOneAndUpdate({ _id: ids[i], userId: req.user.id }, { priority: i + 1 });
    }

    const reordered = await Contact.find({ userId: req.user.id }).sort({ priority: 1 });
    res.json({ contacts: reordered });
  } catch (err) {
    next(err);
  }
});

export default router;
