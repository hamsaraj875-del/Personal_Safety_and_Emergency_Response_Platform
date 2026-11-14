import { calculateHaversineDistance, calculateEtaMinutes } from '../utils/geo.js';
import { Responder } from '../models/Responder.js';

export class ResponderMatcher {
  static rankResponders(userCoords, category = 'General', responders = []) {
    const maxDistanceKm = 10.0;
    const wProximity = 0.4;
    const wSkill = 0.3;
    const wAvailability = 0.15;
    const wRating = 0.15;

    const catLower = (category || '').toLowerCase();

    return responders
      .map(resp => {
        const respLat = resp.location?.coordinates ? resp.location.coordinates[1] : resp.location?.lat || 0;
        const respLng = resp.location?.coordinates ? resp.location.coordinates[0] : resp.location?.lng || 0;

        const distanceKm = calculateHaversineDistance(userCoords.lat, userCoords.lng, respLat, respLng);
        const proximityScore = Math.max(0, 1.0 - distanceKm / maxDistanceKm);
        const etaMins = calculateEtaMinutes(distanceKm);

        let skillScore = 0.5;
        const skills = (resp.skills || []).map(s => s.toLowerCase());

        if (catLower.includes('med') && skills.some(s => s.includes('aid') || s.includes('med') || s.includes('cpr'))) {
          skillScore = 1.0;
        } else if (
          catLower.includes('harass') ||
          catLower.includes('stalk') ||
          catLower.includes('unsafe')
        ) {
          if (skills.some(s => s.includes('security') || s.includes('escort'))) {
            skillScore = 1.0;
          }
        } else if (catLower.includes('accident')) {
          skillScore = skills.some(s => s.includes('trauma') || s.includes('aid')) ? 1.0 : 0.8;
        }

        const isAvailable = resp.available !== undefined ? resp.available : true;
        const isVerified = resp.verified !== undefined ? resp.verified : true;

        if (!isAvailable) {
          // In unit tests, unavailable responder has negative score
          return {
            ...resp,
            id: resp.id || resp._id,
            distanceKm: Math.round(distanceKm * 10.0) / 10.0,
            etaMinutes: etaMins,
            score: -1.0,
            explanation: `${resp.name} is currently offline/unavailable`,
            rankingReason: `${resp.name} is currently offline/unavailable`
          };
        }

        const availabilityScore = isVerified ? 1.0 : 0.7;
        const rating = resp.rating || 5.0;
        const ratingScore = Math.min(1.0, rating / 5.0);

        const totalScore =
          wProximity * proximityScore +
          wSkill * skillScore +
          wAvailability * availabilityScore +
          wRating * ratingScore;

        const roundedDist = Math.round(distanceKm * 10.0) / 10.0;
        const roundedScore = Math.round(totalScore * 1000.0) / 1000.0;

        const explanation = `${roundedDist} km away (${etaMins} min ETA) • ${resp.badge || 'Verified'} • Score: ${Math.round(roundedScore * 100)}%`;
        const rankingReason = `Matched ${resp.name} based on verified credentials, ${roundedDist} km distance, and estimated arrival time of ${etaMins} mins.`;

        return {
          ...resp,
          id: resp.id || resp._id,
          distanceKm: roundedDist,
          etaMinutes: etaMins,
          score: roundedScore,
          explanation,
          rankingReason
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  static async findNearbyResponders(lat, lng, category = 'General', radiusKm = 10.0) {
    // Query MongoDB using 2dsphere near
    const nearbyResponders = await Responder.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: radiusKm * 1000
        }
      }
    }).lean();

    const formatted = nearbyResponders.map(r => ({
      ...r,
      id: r._id,
      location: {
        lat: r.location.coordinates[1],
        lng: r.location.coordinates[0]
      }
    }));

    return this.rankResponders({ lat: Number(lat), lng: Number(lng) }, category, formatted);
  }
}
