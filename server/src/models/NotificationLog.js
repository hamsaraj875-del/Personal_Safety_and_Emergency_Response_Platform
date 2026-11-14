import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const notificationLogSchema = new mongoose.Schema(
  {
    incidentId: { type: String, required: true, index: true },
    channel: { type: String, enum: ['push', 'sms', 'voice'], required: true },
    to: { type: String, required: true },
    body: { type: String, required: true },
    driver: { type: String, default: 'mock' },
    status: { type: String, default: 'SENT' },
    ts: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

applyIdPlugin(notificationLogSchema, 'notif');

export const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);
