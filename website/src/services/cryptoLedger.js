// Cryptographic SHA-256 Hash Chain Service (Tamper-Proof Audit Timeline)
// Formula: H_n = SHA-256( H_{n-1} || timestamp || actor_id || event_type || canonical_json(payload) )

export async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const GENESIS_HASH = "0".repeat(64);

/**
 * Creates a new block adhering strictly to the PS 3.1 specification.
 */
export async function createIncidentBlock({
  index,
  prevHash,
  timestamp,
  actorId,
  actorRole,
  eventType,
  payload
}) {
  const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
  const preImage = `${prevHash}|${timestamp}|${actorId}|${eventType}|${canonicalPayload}`;
  const hash = await sha256(preImage);

  return {
    index,
    prevHash,
    hash,
    timestamp: timestamp || new Date().toISOString(),
    actorId,
    actorRole,
    eventType,
    payload,
    tampered: false
  };
}

/**
 * Verifies the integrity of the hash chain from genesis (H_0) to current block.
 * Returns { isValid, brokenIndex, details }
 */
export async function verifyChainIntegrity(chain) {
  if (!chain || chain.length === 0) {
    return { isValid: true, brokenIndex: null, checkedCount: 0 };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // Check 1: Does this block link to the expected previous hash?
    if (block.prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Broken chain link at Block #${i}: Expected previous hash "${expectedPrevHash.slice(0, 8)}..." but found "${block.prevHash.slice(0, 8)}..."`,
        checkedCount: i + 1
      };
    }

    // Check 2: Does the block's current content recompute to its recorded hash?
    const canonicalPayload = JSON.stringify(block.payload, Object.keys(block.payload).sort());
    const preImage = `${block.prevHash}|${block.timestamp}|${block.actorId}|${block.eventType}|${canonicalPayload}`;
    const recomputedHash = await sha256(preImage);

    if (recomputedHash !== block.hash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Cryptographic payload mismatch at Block #${i}: Payload or metadata was modified after generation! Recomputed: ${recomputedHash.slice(0, 10)}... vs Recorded: ${block.hash.slice(0, 10)}...`,
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
