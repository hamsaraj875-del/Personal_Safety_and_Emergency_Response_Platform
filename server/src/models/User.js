import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    phoneNormalized: { type: String, required: true, unique: true },
    email: { type: String, sparse: true, unique: true },
    passwordHash: { type: String, required: true },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80'
    },
    bloodGroup: { type: String, default: 'O+' },
    emergencyNotes: { type: String, default: 'Asthma inhaler in backpack side pouch' },
    address: { type: String, default: 'BMSCE Campus, Bull Temple Rd, Basavanagudi, Bengaluru, KA 560019' },
    safetyPinHash: { type: String, default: '' },
    duressPinHash: { type: String, default: '' },
    role: { type: String, enum: ['citizen', 'responder', 'authority', 'admin'], default: 'citizen' },
    deviceTokens: [
      {
        token: String,
        platform: { type: String, enum: ['android', 'ios', 'web'] },
        updatedAt: { type: Date, default: Date.now }
      }
    ],
    settings: {
      demoMode: { type: Boolean, default: true },
      escalationSpeed: { type: String, enum: ['FAST', 'NORMAL', 'SPEC'], default: 'FAST' }
    }
  },
  { timestamps: true }
);

applyIdPlugin(userSchema, 'usr');

export const User = mongoose.model('User', userSchema);
