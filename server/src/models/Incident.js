import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';
import { generateIncidentCode, generateTrackingToken } from '../utils/ids.js';

const ladderStepSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    title: { type: String, required: true },
    state: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'FAILED_OR_TIMED_OUT', 'ACKNOWLEDGED'],
      default: 'PENDING'
    },
    startedAt: { type: Date }
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    code: { type: String, default: generateIncidentCode },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'TRIGGERED',
        'NOTIFYING',
        'ACKNOWLEDGED',
        'RESPONDER_ASSIGNED',
        'EN_ROUTE',
        'ON_SCENE',
        'RESOLVED',
        'FALSE_ALARM'
      ],
      default: 'TRIGGERED',
      index: true
    },
    mode: { type: String, enum: ['SOS', 'OFFLINE_SYNC'], default: 'SOS' },
    duress: { type: Boolean, default: false },
    severity: { type: Number, default: 3, min: 1, max: 5 },
    category: { type: String, default: 'General Emergency' },
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
    },
    address: { type: String, default: 'Bangalore Sector Emergency' },
    trackingToken: { type: String, default: generateTrackingToken, unique: true },
    speedProfile: { type: String, enum: ['SPEC', 'FAST', 'NORMAL'], default: 'FAST' },
    cancelWindowEndsAt: { type: Date, required: true },
    ladder: {
      step: { type: Number, default: 0 },
      nextStepAt: { type: Date },
      steps: [ladderStepSchema]
    },
    assignedResponderId: { type: String, default: null },
    assignedResponder: { type: Object, default: null },
    rankedResponders: [{ type: Object }],
    falseAlarmKind: { type: String, enum: ['BUFFER', 'FIELD', null], default: null },
    clientId: { type: String, sparse: true, unique: true },
    resolvedAt: { type: Date, default: null },
    resolvedOutcome: { type: String, default: null },
    failedPinAttempts: { type: Number, default: 0 },
    pinLockedUntil: { type: Date, default: null },
    handoff112: {
      preparedAt: { type: Date },
      payload: { type: Object }
    },
    createdAtClient: { type: Date }
  },
  { timestamps: true }
);

incidentSchema.index({ userId: 1, createdAt: -1 });
incidentSchema.index({ location: '2dsphere' });
applyIdPlugin(incidentSchema, 'inc');

export const Incident = mongoose.model('Incident', incidentSchema);
