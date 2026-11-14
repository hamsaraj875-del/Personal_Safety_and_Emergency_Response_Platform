import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const authorityOfficerSchema = new mongoose.Schema(
  {
    badgeId: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    sector: { type: String, default: 'Bengaluru South Emergency Command' },
    role: { type: String, default: 'authority' }
  },
  { timestamps: true }
);

applyIdPlugin(authorityOfficerSchema, 'off');

export const AuthorityOfficer = mongoose.model('AuthorityOfficer', authorityOfficerSchema);
