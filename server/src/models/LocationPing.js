import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const locationPingSchema = new mongoose.Schema(
  {
    incidentId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    battery: { type: String, default: '100%' },
    ts: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 } // 30 days TTL
  },
  { timestamps: true }
);

locationPingSchema.index({ incidentId: 1, ts: -1 });
applyIdPlugin(locationPingSchema, 'png');

export const LocationPing = mongoose.model('LocationPing', locationPingSchema);
