import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const contactSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
    priority: { type: Number, required: true, min: 1, max: 5 },
    consentGiven: { type: Boolean, default: true },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
    },
    status: { type: String, default: 'Active' }
  },
  { timestamps: true }
);

contactSchema.index({ userId: 1, priority: 1 });
applyIdPlugin(contactSchema, 'cnt');

export const Contact = mongoose.model('Contact', contactSchema);
