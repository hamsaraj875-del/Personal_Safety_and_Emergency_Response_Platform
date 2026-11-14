import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    statusCode: { type: Number, default: 200 },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 } // 24 hours TTL
  },
  { timestamps: true }
);

applyIdPlugin(idempotencyKeySchema, 'idemp');

export const IdempotencyKey = mongoose.model('IdempotencyKey', idempotencyKeySchema);
