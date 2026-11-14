// Initial state and mock data aligning with the research report and UI mockups

export const CURRENT_USER = {
  id: "usr_jenifer_01",
  name: "Jenifer Pilman",
  phone: "+91 98765 43210",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
  bloodGroup: "O+",
  address: "BMSCE Campus, Bull Temple Rd, Basavanagudi, Bengaluru, KA 560019",
  campusAddress: "BMSCE Campus, Bull Temple Rd, Basavanagudi, Bengaluru, KA 560019",
  safetyPin: "1234",
  duressPin: "9999",
  batteryLevel: "88%",
  gpsStatus: "Protected · GPS Ready"
};

export const TRUSTED_CONTACTS = [
  {
    id: "ct_01",
    name: "Aarav Sharma",
    relation: "Brother (Contact 1)",
    phone: "+91 98450 12345",
    priority: 1,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    status: "Active"
  },
  {
    id: "ct_02",
    name: "Priya Pilman",
    relation: "Mother (Contact 2)",
    phone: "+91 98450 67890",
    priority: 2,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    status: "Active"
  },
  {
    id: "ct_03",
    name: "Campus Security Desk",
    relation: "Institutional Control",
    phone: "+91 80 2662 2130",
    priority: 3,
    avatar: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=256&q=80",
    status: "24x7 Monitoring"
  }
];

export const VERIFIED_RESPONDERS = [
  {
    id: "resp_emily_01",
    name: "Emily Dayton",
    title: "1st Responder",
    badge: "Medical & Trauma Certified",
    etaMinutes: 5,
    distanceKm: 1.2,
    rating: 4.95,
    verified: true,
    phone: "+91 98123 45678",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    skills: ["First Aid", "CPR", "Trauma Response"],
    location: { lat: 12.9485, lng: 77.5605 },
    explanation: "0.9 km away (4 min ETA) • Medical-trained • Campus Verified"
  },
  {
    id: "resp_rajesh_02",
    name: "Rajesh Kumar",
    title: "2nd Responder",
    badge: "Campus Marshal & Escort",
    etaMinutes: 7,
    distanceKm: 1.6,
    rating: 4.90,
    verified: true,
    phone: "+91 98234 56789",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    skills: ["Security Escort", "Physical Safety"],
    location: { lat: 12.9345, lng: 77.5715 },
    explanation: "1.6 km away (7 min ETA) • Campus Security • Fast Response"
  },
  {
    id: "resp_sarah_03",
    name: "Dr. Sarah Khan",
    title: "3rd Responder",
    badge: "Emergency Medicine Physician",
    etaMinutes: 11,
    distanceKm: 2.7,
    rating: 4.98,
    verified: true,
    phone: "+91 98345 67890",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80",
    skills: ["Advanced Medical", "Triage Specialist"],
    location: { lat: 12.9530, lng: 77.5730 },
    explanation: "2.7 km away (11 min ETA) • Senior Physician • On-Duty"
  }
];

// Default Campus Coordinates (BMSCE Campus, Basavanagudi, Bengaluru)
export const MAP_CONFIG = {
  center: [12.9416, 77.5655],
  userPos: [12.9416, 77.5655], // "You are here" marker
  responderPos: [12.9485, 77.5605], // "1st Responder" marker (~0.9 km local approach)
  routePoints: [
    [12.9485, 77.5605], // 1st Responder starting point
    [12.9465, 77.5620],
    [12.9442, 77.5638],
    [12.9425, 77.5645],
    [12.9416, 77.5655]  // You are here
  ]
};

// Dynamically generate verified responders relative to the user's local GPS coordinates
export function getNearbyResponders(userCoords) {
  const uLat = userCoords?.lat || MAP_CONFIG.userPos[0];
  const uLng = userCoords?.lng || MAP_CONFIG.userPos[1];

  return [
    {
      id: "resp_emily_01",
      name: "Emily Dayton",
      title: "1st Responder",
      badge: "Medical & Trauma Certified",
      etaMinutes: 4,
      distanceKm: 0.9,
      rating: 4.95,
      verified: true,
      phone: "+91 98123 45678",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      skills: ["First Aid", "CPR", "Trauma Response"],
      location: { lat: uLat + 0.0065, lng: uLng - 0.0050 },
      explanation: "0.9 km away (4 min ETA) • Local EMS Unit • En Route"
    },
    {
      id: "resp_rajesh_02",
      name: "Rajesh Kumar",
      title: "2nd Responder",
      badge: "Campus Marshal & Escort",
      etaMinutes: 7,
      distanceKm: 1.6,

      rating: 4.90,
      verified: true,
      phone: "+91 98234 56789",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
      skills: ["Security Escort", "Physical Safety"],
      location: { lat: uLat - 0.0075, lng: uLng + 0.0065 },
      explanation: "1.6 km away (7 min ETA) • Rapid Security Patrol • Backup"
    },
    {
      id: "resp_sarah_03",
      name: "Dr. Sarah Khan",
      title: "3rd Responder",
      badge: "Emergency Medicine Physician",
      etaMinutes: 11,
      distanceKm: 2.7,
      rating: 4.98,
      verified: true,
      phone: "+91 98345 67890",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80",
      skills: ["Advanced Medical", "Triage Specialist"],
      location: { lat: uLat + 0.0115, lng: uLng + 0.0080 },
      explanation: "2.7 km away (11 min ETA) • Senior Physician • On-Duty"
    }
  ];
}

// Dynamically generate street-level route waypoints between local responder and user
export function getLocalRoutePoints(userCoords, responderCoords) {
  const uLat = userCoords?.lat || MAP_CONFIG.userPos[0];
  const uLng = userCoords?.lng || MAP_CONFIG.userPos[1];
  const rLat = responderCoords?.lat || (uLat + 0.0065);
  const rLng = responderCoords?.lng || (uLng - 0.0050);

  return [
    { lat: rLat, lng: rLng },
    { lat: rLat - 0.0020, lng: rLng + 0.0015 },
    { lat: (rLat + uLat) / 2 + 0.0006, lng: (rLng + uLng) / 2 - 0.0005 },
    { lat: uLat + 0.0015, lng: uLng - 0.0010 },
    { lat: uLat, lng: uLng }
  ];
}

export const QUICK_CATEGORIES = [
  { id: "medical", label: "Medical", color: "red", icon: "Activity" },
  { id: "harassment", label: "Harassment / Unsafe", color: "amber", icon: "ShieldAlert" },
  { id: "accident", label: "Accident", color: "rose", icon: "AlertTriangle" }
];

// Dynamically generate surrounding emergency hubs around the user's live coordinates (Real Places in ~20km radius)
export function getSurroundingSafetyHubs(coords) {
  const lat = coords?.lat || MAP_CONFIG.userPos[0];
  const lng = coords?.lng || MAP_CONFIG.userPos[1];

  return [
    {
      id: "hub_hospital_01",
      name: "KIMS Hospital & Research Centre",
      shortName: "KIMS Hospital",
      type: "hospital",
      icon: "🏥",
      category: "24/7 Medical & Trauma Care",
      distanceMeters: 1100,
      etaMins: 4,
      location: { lat: lat + 0.0075, lng: lng + 0.0045 },
      address: "K.R. Road, Parvathipuram, Vishweshwarapura, Basavanagudi, Bengaluru 560004",
      phone: "+91 80 2662 4000",
      status: "OPEN 24/7",
      openNow: true,
      openingHoursText: "Open 24 hours · Casualty, ICU & 3 Ambulances Ready",
      isTraumaCenter: true,
      briefing: "Premier teaching hospital with 24/7 Level-1 Emergency Trauma Care, Blood Bank, and Critical Care ICU."
    },
    {
      id: "hub_police_02",
      name: "Basavanagudi Police Station",
      shortName: "Basavanagudi Police",
      type: "police",
      icon: "🚓",
      category: "Law Enforcement & Rapid Patrol",
      distanceMeters: 680,
      etaMins: 3,
      location: { lat: lat - 0.0035, lng: lng + 0.0030 },
      address: "Tagore Circle, Netkallappa Cir, Basavanagudi, Bengaluru 560004",
      phone: "080-22942568",
      status: "OPEN 24/7",
      openNow: true,
      openingHoursText: "Open 24 hours · 2 PCR Vans & Hoysala Units on Patrol",
      isTraumaCenter: false,
      briefing: "Divisional law enforcement headquarters with 24/7 women safety desk and live GPS patrol units."
    },
    {
      id: "hub_safezone_03",
      name: "BMSCE Campus Security & Safety Base",
      shortName: "BMSCE Safe Haven",
      type: "safe_zone",
      icon: "🛡️",
      category: "Guarded Safe Haven",
      distanceMeters: 290,
      etaMins: 1,
      location: { lat: lat + 0.0012, lng: lng - 0.0018 },
      address: "Bull Temple Road, Basavanagudi, Bengaluru 560019",
      phone: "+91 80 2662 2130",
      status: "STAFFED 24/7",
      openNow: true,
      openingHoursText: "Staffed 24x7 · CCTV Monitored & SOS Terminal Active",
      isTraumaCenter: false,
      briefing: "Guarded physical safe haven with biometric access barriers, first-aid station, and high-def security surveillance."
    },
    {
      id: "hub_fire_04",
      name: "South End Circle Fire & Emergency Rescue Station",
      shortName: "South End Fire Station",
      type: "fire_rescue",
      icon: "🚒",
      category: "Fire & Disaster Rescue",
      distanceMeters: 850,
      etaMins: 4,
      location: { lat: lat - 0.0060, lng: lng - 0.0035 },
      address: "South End Circle, 9th Block, Jayanagar / Basavanagudi, Bengaluru 560011",
      phone: "101",
      status: "ON-DUTY 24/7",
      openNow: true,
      openingHoursText: "On-Duty 24 Hours · Rapid Fire Tender & Rescue Squad Standby",
      isTraumaCenter: false,
      briefing: "State emergency fire and hazmat rescue base with hydraulic extrication equipment and rapid tenders."
    }
  ];
}
