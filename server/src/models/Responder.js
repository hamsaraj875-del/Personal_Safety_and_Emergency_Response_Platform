import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const responderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    badge: { type: String, required: true },
    skills: [{ type: String }],
    category: { type: String, enum: ['Security', 'Medical', 'Volunteer'], default: 'Security' },
    phone: { type: String, required: true },
    passwordHash: { type: String, default: '' },
    avatar: { type: String, default: '' },
    rating: { type: Number, default: 4.8 },
    verified: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
    historicalResponseMinutes: { type: Number, default: 4 },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  { timestamps: true }
);

responderSchema.index({ location: '2dsphere' });
applyIdPlugin(responderSchema, 'resp');

export const Responder = mongoose.model('Responder', responderSchema);
