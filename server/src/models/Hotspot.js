import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const hotspotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },
    collisionCount: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'], default: 'HIGH' },
    peakHours: { type: String, default: '18:00 - 22:00' },
    primaryCause: { type: String, default: 'Heavy mixed traffic & speed differential' },
    radiusMeters: { type: Number, default: 350 },
    trend: { type: String, default: 'Stable' },
    dangerScore: { type: Number, default: 75 },
    simulated: { type: Boolean, default: true }
  },
  { timestamps: true }
);

hotspotSchema.index({ location: '2dsphere' });
applyIdPlugin(hotspotSchema, 'hot');

export const Hotspot = mongoose.model('Hotspot', hotspotSchema);
