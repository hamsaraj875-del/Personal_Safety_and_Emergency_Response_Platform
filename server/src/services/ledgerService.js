import crypto from 'node:crypto';
import { LedgerBlock } from '../models/LedgerBlock.js';
import { canonicalJson } from '../utils/canonicalJson.js';

export const GENESIS_HASH = '0'.repeat(64);

export function computeBlockHash({ prevHash, timestamp, actorId, eventType, payload }) {
  const cleanPayload = payload !== undefined && payload !== null ? JSON.parse(JSON.stringify(payload)) : {};
  const cPayload = canonicalJson(cleanPayload);
  const preImage = `${prevHash}|${timestamp}|${actorId}|${eventType}|${cPayload}`;
  return crypto.createHash('sha256').update(preImage).digest('hex');
}

export async function appendLedgerBlock({ incidentId, actorId, actorRole, eventType, payload }) {
  const cleanPayload = payload !== undefined && payload !== null ? JSON.parse(JSON.stringify(payload)) : {};
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Find latest block for incident
      const latestBlock = await LedgerBlock.findOne({ incidentId }).sort({ index: -1 });

      const index = latestBlock ? latestBlock.index + 1 : 0;
      const prevHash = latestBlock ? latestBlock.hash : GENESIS_HASH;
      const timestamp = new Date().toISOString();

      const hash = computeBlockHash({ prevHash, timestamp, actorId, eventType, payload: cleanPayload });

      const block = await LedgerBlock.create({
        incidentId,
        index,
        prevHash,
        hash,
        timestamp,
        actorId,
        actorRole,
        eventType,
        payload: cleanPayload,
        tampered: false
      });

      return block;
    } catch (err) {
      if (err.code === 11000 && attempt < maxRetries) {
        // Unique index collision on {incidentId, index}, retry
        await new Promise(r => setTimeout(r, 50 * attempt));
        continue;
      }
      throw err;
    }
  }
}

export async function verifyChainIntegrity(incidentId) {
  const chain = await LedgerBlock.find({ incidentId }).sort({ index: 1 });

  if (!chain || chain.length === 0) {
    return {
      isValid: true,
      brokenIndex: null,
      reason: 'Empty ledger chain is valid.',
      checkedCount: 0
    };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // Check index sequence
    if (block.index !== i) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Broken chain sequence: expected index ${i} but found ${block.index}.`,
        checkedCount: i + 1
      };
    }

    // Check prevHash link
    if (block.prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Broken chain link at Block #${i}: Expected previous hash "${expectedPrevHash.slice(0, 8)}..." but found "${block.prevHash.slice(0, 8)}..."`,
        checkedCount: i + 1
      };
    }

    // Check recomputed hash
    const recomputed = computeBlockHash({
      prevHash: block.prevHash,
      timestamp: block.timestamp,
      actorId: block.actorId,
      eventType: block.eventType,
      payload: block.payload
    });

    if (recomputed !== block.hash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Cryptographic payload mismatch at Block #${i}: Payload or metadata was modified after generation! Recomputed: ${recomputed.slice(0, 10)}... vs Recorded: ${block.hash.slice(0, 10)}...`,
        checkedCount: i + 1
      };
    }

    expectedPrevHash = block.hash;
  }

  return {
    isValid: true,
    brokenIndex: null,
    reason: `All ${chain.length} cryptographic blocks verified sequentially from Genesis H_0. Zero tampering detected.`,
    checkedCount: chain.length
  };
}

export async function tamperBlock(incidentId, blockIndex = 0) {
  const block = await LedgerBlock.findOne({ incidentId, index: blockIndex });
  if (!block) {
    throw new Error(`Block #${blockIndex} not found for incident ${incidentId}`);
  }

  // Backup original payload
  const originalPayload = JSON.parse(JSON.stringify(block.payload));
  block.set('__originalPayload', originalPayload, { strict: false });
  block.payload = {
    ...originalPayload,
    __tampered_at: new Date().toISOString(),
    tamperedNote: 'FORGED_AUDIT_LOG_TAMPERED'
  };
  block.tampered = true;
  block.markModified('payload');
  await block.save();

  return {
    incidentId,
    blockIndex,
    originalHash: block.hash,
    tampered: true
  };
}

export async function restoreTamperedBlock(incidentId, blockIndex = 0) {
  const block = await LedgerBlock.findOne({ incidentId, index: blockIndex });
  if (!block) {
    throw new Error(`Block #${blockIndex} not found for incident ${incidentId}`);
  }

  const originalPayload = block.get('__originalPayload');
  if (originalPayload) {
    block.payload = originalPayload;
    block.set('__originalPayload', undefined, { strict: false });
  } else {
    // Fallback: strip tamper fields
    const p = { ...block.payload };
    delete p.__tampered_at;
    delete p.tamperedNote;
    block.payload = p;
  }

  block.tampered = false;
  block.markModified('payload');
  await block.save();

  return {
    incidentId,
    blockIndex,
    restored: true
  };
}
