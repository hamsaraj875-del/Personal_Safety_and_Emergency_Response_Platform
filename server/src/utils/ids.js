import crypto from 'node:crypto';

export function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function generateIncidentCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `INC-${num}`;
}

export function generateTrackingToken() {
  return crypto.randomBytes(12).toString('hex');
}
