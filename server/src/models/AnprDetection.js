import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const anprDetectionSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    ts: { type: Date, default: Date.now, index: true },
    locationName: { type: String, required: true },
    speedKmh: { type: Number, default: 45 },
    status: { type: String, default: 'FLAGGED' },
    alertType: { type: String, default: 'CRITICAL' },
    confidence: { type: String, default: '98.5%' },
    reason: { type: String, default: '' },
    image: { type: String, default: '' },
    broadcasted: { type: Boolean, default: false },
    simulated: { type: Boolean, default: true }
  },
  { timestamps: true }
);

applyIdPlugin(anprDetectionSchema, 'anpr');

export const AnprDetection = mongoose.model('AnprDetection', anprDetectionSchema);
