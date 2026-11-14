import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const incidentEventSchema = new mongoose.Schema(
  {
    incidentId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, required: true },
    timestamp: { type: String, required: true }, // ISO string
    isOffline: { type: Boolean, default: false },
    actorId: { type: String, default: 'system' },
    actorRole: { type: String, default: 'system' }
  },
  { timestamps: true }
);

incidentEventSchema.index({ incidentId: 1, timestamp: 1 });
applyIdPlugin(incidentEventSchema, 'evt');

export const IncidentEvent = mongoose.model('IncidentEvent', incidentEventSchema);
