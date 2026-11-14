// Authority Command & Regional Analytics Engine
// Realistic Bangalore Sector Emergency Telemetry & Vehicle Scanner (ANPR)

export function generateSectorData(centerLat = 12.9352, centerLng = 77.5358) {
  const offset = (dLatKm, dLngKm) => ({
    lat: parseFloat((centerLat + dLatKm / 111).toFixed(5)),
    lng: parseFloat((centerLng + dLngKm / 100).toFixed(5))
  });

  // 1. Where Most Accidents Are Happening (Realistic Sector Historical Collisions)
  const accidentHotspots = [
    {
      id: "hotspot_01",
      name: "Outer Ring Rd & Bull Temple Junction",
      location: offset(1.4, -0.8),
      collisionCount: 24,
      totalAnalyzed: 142,
      riskLevel: "CRITICAL",
      peakHours: "21:30 – 02:00",
      primaryCause: "Night 2-wheeler speed differential & unlit median",
      radiusMeters: 450,
      trend: "+14% weekend surge",
      dangerScore: 92
    },
    {
      id: "hotspot_02",
      name: "National College Metro Link",
      location: offset(-0.9, 1.2),
      collisionCount: 16,
      totalAnalyzed: 142,
      riskLevel: "HIGH",
      peakHours: "18:00 – 21:00",
      primaryCause: "Pedestrian crossing rush & blind bus halt",
      radiusMeters: 350,
      trend: "-5% under patrol",
      dangerScore: 78
    },
    {
      id: "hotspot_03",
      name: "Basavanagudi Market West Arterial",
      location: offset(-1.8, -0.6),
      collisionCount: 11,
      totalAnalyzed: 142,
      riskLevel: "HIGH",
      peakHours: "19:30 – 23:00",
      primaryCause: "Mixed auto-rickshaw & delivery bike congestion",
      radiusMeters: 300,
      trend: "+8% this week",
      dangerScore: 72
    },
    {
      id: "hotspot_04",
      name: "South End Circle Bottleneck",
      location: offset(0.8, 2.1),
      collisionCount: 8,
      totalAnalyzed: 142,
      riskLevel: "MODERATE",
      peakHours: "13:30 – 16:00",
      primaryCause: "Sudden left-turn weave from flyover slip road",
      radiusMeters: 250,
      trend: "Stable",
      dangerScore: 60
    },
    {
      id: "hotspot_05",
      name: "Lalbagh West Gate Highway Feed",
      location: offset(2.3, 1.1),
      collisionCount: 6,
      totalAnalyzed: 142,
      riskLevel: "MODERATE",
      peakHours: "00:30 – 04:30",
      primaryCause: "Heavy intercity freight truck blind spots",
      radiusMeters: 400,
      trend: "+4% late nights",
      dangerScore: 52
    }
  ];

  // 2. Vehicle Scanner / ANPR (Automatic Number Plate Recognition & Hit-and-Run Tracking)
  const licensePlateDetections = [
    {
      id: "anpr_01",
      plateNumber: "KA-01-MJ-8921",
      vehicleModel: "Black Toyota Fortuner",
      timestamp: "Just now (00:14 ago)",
      locationName: "Outer Ring Rd Cam #04",
      speedKmh: 84,
      status: "HIT & RUN ALERT",
      confidence: "99.4%",
      alertType: "CRITICAL",
      reason: "Matched description of pedestrian collision near Bull Temple Rd. Fled scene without stopping.",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "anpr_02",
      plateNumber: "KA-05-NB-4412",
      vehicleModel: "White Hyundai Creta",
      timestamp: "2 mins ago",
      locationName: "National College Jn Cam #02",
      speedKmh: 42,
      status: "AMBULANCE BLOCKER",
      confidence: "98.8%",
      alertType: "WARNING",
      reason: "Repeatedly blocking designated green corridor for Ambulance KA-01-EA-104.",
      image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "anpr_03",
      plateNumber: "KA-04-EX-9910",
      vehicleModel: "Silver Maruti Swift",
      timestamp: "4 mins ago",
      locationName: "South End Circle Cam #01",
      speedKmh: 35,
      status: "STOLEN VEHICLE MATCH",
      confidence: "97.6%",
      alertType: "ALERT",
      reason: "Active FIR #892 registered at Jayanagar Police Station (Stolen 2 days ago).",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "anpr_04",
      plateNumber: "KA-02-ZZ-3301",
      vehicleModel: "Red Honda City",
      timestamp: "7 mins ago",
      locationName: "Lalbagh West Gate Cam #03",
      speedKmh: 48,
      status: "CLEAR / VERIFIED",
      confidence: "99.8%",
      alertType: "NORMAL",
      reason: "Normal commute vehicle, valid insurance, zero outstanding emergency flags.",
      image: "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=400&q=80"
    }
  ];

  // 3. Active Emergencies (Live Pulse)
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
      ladderDetails: "Family Notified • First Responder Emily Dayton Dispatched",
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
      ladderDetails: "Contact 1 Timeout (30s) • Escalated to Contact 2 & Campus Security",
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

  // 4. Ambulance Fleet & Clean Before/After Rebalancing
  const ambulanceFleet = [
    {
      id: "amb_01",
      vehicleNo: "KA-01-EA-104",
      type: "Advanced Life Support (ALS)",
      driver: "Ramesh K.",
      status: "Dispatched",
      location: offset(0.6, 0.2),
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

  // Coverage Blind Spot & Rebalancing
  const coverageBlindSpot = {
    id: "blind_spot_01",
    name: "Outer Ring Road Junction 4 (East Corridor)",
    location: offset(2.1, -1.2),
    currentEtaMinutes: 11.4,
    recommendedEtaMinutes: 4.2,
    deficitSeverity: "HIGH",
    reason: "Zero emergency vehicles within 3.5 km radius during night hours."
  };

  const displacementPlan = {
    actionTitle: "Rebalance 2 ALS Ambulances to Outer Ring Junction 4",
    currentEta: "11.4 min",
    optimizedEta: "4.2 min",
    timeSaved: "7.2 min faster response",
    candidateVehicles: ["KA-01-EA-312", "KA-01-EA-415"],
    targetStagingLocation: offset(2.0, -1.1),
    isExecuted: false
  };

  // 5. Clean, Simple False Cases Breakdown (Realistic Sector Data: 380 Total Alerts)
  const falseCaseStats = {
    totalCitywideAlerts: 380,
    confirmedEmergenciesCount: 294, // 77.4%
    cancelledInBufferCount: 68,     // 17.9%
    fieldFalseAlarmsCount: 18,      // 4.7%
    hoursSavedByBuffer: "142 hrs",
    topAccidentalPocketDialSpot: "Sector 3 Bus Terminal (Pocket friction during boarding)"
  };

  return {
    sectorName: "Bengaluru South Emergency Command",
    centerCoords: { lat: centerLat, lng: centerLng },
    telemetry: {
      totalAnalyzed: "142",
      activeSosCount: 3,
      medianResponseTime: "04m 18s",
      ambulancesReadyCount: 4,
      totalAmbulancesCount: 6,
      sectorStabilityScore: 92,
      scannedPlatesCount: "1,280"
    },
    accidentHotspots,
    licensePlateDetections,
    activeIncidents,
    ambulanceFleet,
    coverageBlindSpot,
    displacementPlan,
    falseCaseStats
  };
}
