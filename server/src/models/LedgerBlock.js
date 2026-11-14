import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const ledgerBlockSchema = new mongoose.Schema(
  {
    incidentId: { type: String, required: true, index: true },
    index: { type: Number, required: true },
    prevHash: { type: String, required: true },
    hash: { type: String, required: true },
    timestamp: { type: String, required: true }, // ISO string
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    eventType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    tampered: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ledgerBlockSchema.index({ incidentId: 1, index: 1 }, { unique: true });
applyIdPlugin(ledgerBlockSchema, 'blk');

export const LedgerBlock = mongoose.model('LedgerBlock', ledgerBlockSchema);
