import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson } from '../src/utils/canonicalJson.js';
import { computeBlockHash, GENESIS_HASH } from '../src/services/ledgerService.js';

describe('Cryptographic Ledger Tests', () => {
  test('canonicalJson recursively sorts keys without whitespace', () => {
    const raw = { z: 1, a: { d: 4, b: [3, 2, { y: 9, x: 8 }] } };
    const expected = '{"a":{"b":[3,2,{"x":8,"y":9}],"d":4},"z":1}';
    assert.strictEqual(canonicalJson(raw), expected);
  });

  test('computeBlockHash produces deterministic SHA-256', () => {
    const blockData = {
      prevHash: GENESIS_HASH,
      timestamp: '2026-11-14T10:00:00.000Z',
      actorId: 'usr_jenifer_01',
      eventType: 'INCIDENT_TRIGGERED',
      payload: { lat: 12.9352, lng: 77.5358 }
    };

    const hash1 = computeBlockHash(blockData);
    const hash2 = computeBlockHash(blockData);

    assert.strictEqual(hash1.length, 64);
    assert.strictEqual(hash1, hash2);

    // Modifying payload changes hash
    const tamperedHash = computeBlockHash({
      ...blockData,
      payload: { lat: 12.9352, lng: 77.5359 }
    });
    assert.notStrictEqual(hash1, tamperedHash);
  });

  test('Hash chain links verify from Genesis H_0', () => {
    const b0 = {
      prevHash: GENESIS_HASH,
      timestamp: '2026-11-14T10:00:00.000Z',
      actorId: 'usr_jenifer_01',
      eventType: 'TRIGGER',
      payload: { step: 0 }
    };
    const h0 = computeBlockHash(b0);

    const b1 = {
      prevHash: h0,
      timestamp: '2026-11-14T10:00:10.000Z',
      actorId: 'resp_emily_01',
      eventType: 'DISPATCH',
      payload: { step: 1 }
    };
    const h1 = computeBlockHash(b1);

    assert.strictEqual(b1.prevHash, h0);
    assert.strictEqual(h1.length, 64);
  });
});
