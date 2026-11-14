import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ResponderMatcher } from '../src/services/responderMatcher.js';
import { calculateHaversineDistance } from '../src/utils/geo.js';

describe('ResponderMatcher Tests (Port of ResponderMatcherTest.kt)', () => {
  const DEFAULT_LATITUDE = 12.9352;
  const DEFAULT_LONGITUDE = 77.5358;

  const mockResponders = [
    {
      id: 'resp_emily_01',
      name: 'Emily Dayton',
      title: 'Trauma Paramedic',
      badge: 'EMS-991',
      skills: ['Advanced First Aid', 'CPR Certified', 'Trauma Stabilization'],
      category: 'Medical',
      rating: 4.9,
      verified: true,
      available: true,
      location: { coordinates: [77.532, 12.9385] }
    },
    {
      id: 'resp_arjun_02',
      name: 'Arjun',
      title: 'Campus Patrol Leader',
      badge: 'SEC-402',
      skills: ['Physical Escort', 'De-escalation', 'Night Navigation'],
      category: 'Security',
      rating: 4.7,
      verified: true,
      available: false, // Arjun is offline
      location: { coordinates: [77.541, 12.931] }
    },
    {
      id: 'resp_priya_03',
      name: 'Dr. Priya Nair',
      title: 'Emergency Medical Officer',
      badge: 'DOC-112',
      skills: ['Triage Management', 'Advanced Cardiac Life Support'],
      category: 'Medical',
      rating: 5.0,
      verified: true,
      available: true,
      location: { coordinates: [77.545, 12.929] }
    }
  ];

  test('testBestResponderSelection', () => {
    const list = ResponderMatcher.rankResponders(
      { lat: DEFAULT_LATITUDE, lng: DEFAULT_LONGITUDE },
      'Medical Emergency',
      mockResponders
    );

    const best = list[0];

    assert.ok(best, 'Best responder must not be null');
    assert.strictEqual(best.name, 'Emily Dayton');
    assert.strictEqual(best.available, true, 'Best responder must be available');
    assert.strictEqual(best.verified, true, 'Best responder should be verified');
    assert.ok(list.length > 0, 'Scored list must have responders');

    // Verify unavailable responder (Arjun) has negative score (-1.0)
    const arjun = list.find(it => it.name === 'Arjun');
    assert.ok(arjun, 'Arjun must be present in list');
    assert.strictEqual(arjun.available, false);
    assert.strictEqual(arjun.score, -1.0);
  });

  test('testRankingReasonContainsExpectedCriteria', () => {
    const list = ResponderMatcher.rankResponders(
      { lat: DEFAULT_LATITUDE, lng: DEFAULT_LONGITUDE },
      'Medical Emergency',
      mockResponders
    );

    const best = list[0];
    assert.ok(best);
    const reason = best.rankingReason;

    assert.ok(reason.includes(best.name), 'Reason should mention name');
    assert.ok(reason.includes('verified'), 'Reason should mention verified');
    assert.ok(reason.includes('estimated arrival time'), 'Reason should mention arrival time');
  });

  test('testHaversineDistanceAccuracy', () => {
    // Distance from BMSCE (12.9352, 77.5358) to Victoria Hospital (12.963, 77.573)
    const distKm = calculateHaversineDistance(12.9352, 77.5358, 12.963, 77.573);
    assert.ok(distKm > 4.5 && distKm < 5.5, `Distance should be ~5km, got ${distKm.toFixed(2)}km`);
  });
});
