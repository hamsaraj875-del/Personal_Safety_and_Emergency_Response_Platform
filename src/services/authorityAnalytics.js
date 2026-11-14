// Authority Command & Regional Analytics Engine
// Dynamically generates surrounding data anchored to the Authority's GPS location

export function generateSectorData(centerLat = 12.9352, centerLng = 77.5358) {
  // Offset generator helper (roughly ~111km per lat deg, ~100km per lng deg)
  const offset = (dLatKm, dLngKm) => ({
    lat: parseFloat((centerLat + dLatKm / 111).toFixed(5)),
    lng: parseFloat((centerLng + dLngKm / 100).toFixed(5))
  });

  // 1. Where Most Accidents Are Happening (Top 5 High-Risk Collision Corridors)
  const accidentHotspots = [
    {
      id: "hotspot_01",
      name: "Outer Ring Rd & Bull Temple Junction",
      location: offset(1.4, -0.8),
      collisionCount: 19,
      riskLevel: "CRITICAL",
      peakHours: "21:30 – 02:00",
      primaryCause: "2-wheeler night speed differential & unlit median",
      radiusMeters: 450,
      recentTrend: "+14% this month"
    },
    {
      id: "hotspot_02",
      name: "National College Metro Link",
      location: offset(-0.9, 1.2),
      collisionCount: 14,
      riskLevel: "HIGH",
      peakHours: "18:00 – 21:00",
      primaryCause: "High-density pedestrian crossing conflict",
      radiusMeters: 350,
      recentTrend: "-5% (patrol presence active)"
    },
    {
      id: "hotspot_03",
      name: "Basavanagudi Market West Corridor",
      location: offset(-1.8, -0.6),
      collisionCount: 11,
      riskLevel: "HIGH",
      peakHours: "19:30 – 23:00",
      primaryCause: "Narrow freight merge & mixed vehicular traffic",
      radiusMeters: 300,
      recentTrend: "+8% this week"
    },
    {
      id: "hotspot_04",
      name: "South End Circle Bottleneck",
      location: offset(0.8, 2.1),
      collisionCount: 8,
      riskLevel: "MODERATE",
      peakHours: "13:30 – 16:00",
      primaryCause: "Blind left turn from secondary arterial lane",
      radiusMeters: 250,
      recentTrend: "Stable"
    },
    {
      id: "hotspot_05",
      name: "Lalbagh West Gate Highway Feed",
      location: offset(2.3, 1.1),
      collisionCount: 7,
      riskLevel: "MODERATE",
      peakHours: "00:30 – 04:30",
      primaryCause: "Heavy transport lorry blind spots",
      radiusMeters: 400,
      recentTrend: "+12% on weekends"
    }
  ];

  // 2. How Everything Is Going Around The Place (Active Emergencies Feed)
  const activeIncidents = [
    {
      id: "INC-892401",
      userName: "Kavya Murthy",
      category: "medical",
      categoryLabel: "Trauma / Bike Collision",
      severity: 5,
      location: offset(0.9, 0.4),
      address: "Near DVG Road Junction, Basavanagudi",
      escalationStep: 3,
      elapsedSeconds: 84,
      status: "EN_ROUTE",
      assignedUnit: "ALS-Ambulance #04 (Driver: Ramesh)",
      assignedEta: "3.2 min",
      ladderDetails: "Contact 1 (Mother) Alerted • Responder Emily Dayton Dispatched",
      telemetry: { speed: "0 km/h", accuracy: "6m", battery: "74%" }
    },
    {
      id: "INC-892395",
      userName: "Rohan V.",
      category: "harassment",
      categoryLabel: "Active Stalking",
      severity: 4,
      location: offset(-1.2, 0.8),
      address: "Ashok Nagar 3rd Cross, near Metro Gate B",
      escalationStep: 2,
      elapsedSeconds: 42,
      status: "NOTIFYING",
      assignedUnit: "Patrol Escort #02",
      assignedEta: "4.5 min",
      ladderDetails: "Contact 1 Ignored (30s timeout) • Escalated to Contact 2 & Security",
      telemetry: { speed: "4.2 km/h", accuracy: "8m", battery: "62%" }
    },
    {
      id: "INC-892388",
      userName: "Ananya Sen",
      category: "accident",
      categoryLabel: "Car Fender Collision",
      severity: 2,
      location: offset(1.6, -1.4),
      address: "Bull Temple Ring Road Merge",
      escalationStep: 4,
      elapsedSeconds: 210,
      status: "ON_SCENE",
      assignedUnit: "BLS-Ambulance #09 (Driver: Anand)",
      assignedEta: "Arrived",
      ladderDetails: "First responder on scene • First-aid administered",
      telemetry: { speed: "0 km/h", accuracy: "5m", battery: "91%" }
    }
  ];

  // 3. Where Most Ambulances Have To Be Displaced (Fleet Rebalancing)
  const ambulanceFleet = [
    {
      id: "amb_01",
      vehicleNo: "KA-01-EA-104",
      type: "Advanced Life Support (ALS)",
      driver: "Ramesh K.",
      status: "Dispatched",
      location: offset(0.6, 0.2),
      targetIncident: "INC-892401",
      fuel: "86%",
      etaToIncident: "3.2 min"
    },
    {
      id: "amb_02",
      vehicleNo: "KA-01-EA-208",
      type: "Basic Life Support (BLS)",
      driver: "Anand M.",
      status: "On Scene",
      location: offset(1.6, -1.4),
      targetIncident: "INC-892388",
      fuel: "72%",
      etaToIncident: "Arrived"
    },
    {
      id: "amb_03",
      vehicleNo: "KA-01-EA-312",
      type: "Advanced Life Support (ALS)",
      driver: "Siddharth Rao",
      status: "Ready",
      location: offset(-0.4, -0.9),
      depot: "Victoria Hospital Annex",
      fuel: "95%",
      isDisplaceCandidate: true
    },
    {
      id: "amb_04",
      vehicleNo: "KA-01-EA-415",
      type: "Advanced Life Support (ALS)",
      driver: "Karthik P.",
      status: "Ready",
      location: offset(-0.2, -1.1),
      depot: "Victoria Hospital Annex",
      fuel: "88%",
      isDisplaceCandidate: true
    },
    {
      id: "amb_05",
      vehicleNo: "KA-01-EA-520",
      type: "First Responder Bike Medic",
      driver: "Pooja V.",
      status: "Ready",
      location: offset(1.1, 1.8),
      depot: "Jayanagar 4th Block Hub",
      fuel: "100%",
      isDisplaceCandidate: false
    },
    {
      id: "amb_06",
      vehicleNo: "KA-01-EA-630",
      type: "Basic Life Support (BLS)",
      driver: "Vijay Gowda",
      status: "Ready",
      location: offset(-2.1, 0.4),
      depot: "South End Emergency Post",
      fuel: "78%",
      isDisplaceCandidate: false
    }
  ];

  // AI Coverage Blind Spot (Zone where arrival ETA currently exceeds 8 minutes)
  const coverageBlindSpot = {
    id: "blind_spot_01",
    name: "Outer Ring Road Junction 4 (East Corridor)",
    location: offset(2.1, -1.2),
    currentEtaMinutes: 11.4,
    recommendedEtaMinutes: 4.2,
    deficitSeverity: "HIGH",
    reason: "Zero active emergency units stationed within a 3.5 km perimeter during night transit peak."
  };

  // AI Fleet Displacement Action Plan
  const displacementPlan = {
    recommendedMove: "Rebalance 2 ALS Ambulances from Victoria Depot → Outer Ring Junction 4",
    candidateVehicles: ["KA-01-EA-312", "KA-01-EA-415"],
    targetStagingLocation: offset(2.0, -1.1),
    projectedEtaSavings: "7.2 min faster response for 14,000 residents",
    urgency: "HIGH",
    isExecuted: false
  };

  // 4. How Many False Cases (False Alarm Audit Statistics)
  const falseCaseStats = {
    totalAlertsLast30Days: 142,
    confirmedEmergencies: 112, // 78.9%
    cancelledInBuffer: 21,      // 14.8% (5-sec buffer aborts)
    verifiedFalseAlarms: 9,     // 6.3% (field verified)
    falseRatePercent: 14.8,     // Standard metric
    bufferSavingsEstimateHours: "18.4 hours of saved dispatch time",
    breakdown: [
      { reason: "5-Sec Buffer Abort (Pocket Dial)", count: 21, share: "70%" },
      { reason: "Resolved with PIN < 60s", count: 6, share: "20%" },
      { reason: "Duplicate Alert for Same Accident", count: 3, share: "10%" }
    ],
    hoaxCorridorFlagged: "Sector 3 Bus Terminal (repeated pocket dials due to transit vibration)"
  };

  return {
    sectorName: "Bengaluru South Emergency Sector",
    centerCoords: { lat: centerLat, lng: centerLng },
    telemetry: {
      activeSosCount: 3,
      medianResponseTime: "03m 42s",
      ambulancesReadyCount: 4,
      totalAmbulancesCount: 6,
      sectorStabilityScore: 92, // out of 100
      falseCaseRate: 14.8
    },
    accidentHotspots,
    activeIncidents,
    ambulanceFleet,
    coverageBlindSpot,
    displacementPlan,
    falseCaseStats
  };
}
