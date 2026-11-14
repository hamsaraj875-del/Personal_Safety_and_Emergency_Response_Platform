import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const safetyHubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    type: {
      type: String,
      enum: ['hospital', 'police', 'safe_zone', 'fire_rescue'],
      required: true
    },
    icon: { type: String, default: 'hospital' },
    category: { type: String, default: 'Trauma Center' },
    distanceMeters: { type: Number, default: 0 },
    etaMins: { type: Number, default: 0 },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, default: '24x7 Emergency' },
    openNow: { type: Boolean, default: true },
    openingHoursText: { type: String, default: 'Open 24 Hours · Immediate Triage' },
    isTraumaCenter: { type: Boolean, default: false },
    briefing: { type: String, default: '' },
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
    }
  },
  { timestamps: true }
);

safetyHubSchema.index({ location: '2dsphere' });
applyIdPlugin(safetyHubSchema, 'hub');

export const SafetyHub = mongoose.model('SafetyHub', safetyHubSchema);
