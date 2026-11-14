// Explainable Responder Matching Engine
// Score = w1 * Proximity + w2 * SkillMatch + w3 * Availability + w4 * Rating

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in kilometers
}

export function rankResponders(userCoords, category, responders) {
  const maxDistanceKm = 10.0;
  const weights = {
    proximity: 0.40,
    skill: 0.30,
    availability: 0.15,
    rating: 0.15
  };

  const scored = responders.map(resp => {
    // 1. Proximity score (0 to 1)
    const distanceKm = calculateHaversineDistance(
      userCoords.lat,
      userCoords.lng,
      resp.location.lat,
      resp.location.lng
    );
    const proximityScore = Math.max(0, 1 - distanceKm / maxDistanceKm);

    // Urban ETA estimate: ~25 km/h urban speed -> ~2.4 mins per km + 1 min dispatch buffer
    const etaMins = Math.max(1, Math.round(distanceKm * 2.4 + 1));

    // 2. Skill match score
    let skillScore = 0.5;
    const catLower = (category || "").toLowerCase();
    if (catLower.includes("med") && resp.skills.some(s => s.toLowerCase().includes("aid") || s.toLowerCase().includes("med") || s.toLowerCase().includes("cpr"))) {
      skillScore = 1.0;
    } else if (catLower.includes("harass") || catLower.includes("stalk") || catLower.includes("unsafe")) {
      if (resp.skills.some(s => s.toLowerCase().includes("security") || s.toLowerCase().includes("escort") || s.toLowerCase().includes("liaison"))) {
        skillScore = 1.0;
      }
    } else if (catLower.includes("accident")) {
      skillScore = resp.skills.some(s => s.toLowerCase().includes("trauma") || s.toLowerCase().includes("aid")) ? 1.0 : 0.8;
    }

    // 3. Availability score
    const availabilityScore = resp.verified ? 1.0 : 0.7;

    // 4. Verification & Rating score (out of 5)
    const ratingScore = Math.min(1.0, (resp.rating || 4.5) / 5.0);

    // Total weighted score
    const totalScore = (
      weights.proximity * proximityScore +
      weights.skill * skillScore +
      weights.availability * availabilityScore +
      weights.rating * ratingScore
    );

    return {
      ...resp,
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      etaMinutes: etaMins,
      score: parseFloat(totalScore.toFixed(3)),
      explanation: `${distanceKm.toFixed(1)} km away (${etaMins} min ETA) • ${resp.badge} • Score: ${Math.round(totalScore * 100)}%`
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
