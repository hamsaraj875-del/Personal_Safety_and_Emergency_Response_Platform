// Initial state and mock data aligning with the research report and UI mockups

export const CURRENT_USER = {
  id: "usr_jenifer_01",
  name: "Jenifer Pilman",
  phone: "+91 98765 43210",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
  bloodGroup: "O+",
  address: "151-171 Montclair Ave Newark, NJ 07104, USA",
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
    location: { lat: 40.7628, lng: -74.1752 },
    explanation: "1.2 km away (5 min ETA) • Medical-trained • Campus Verified"
  },
  {
    id: "resp_rajesh_02",
    name: "Rajesh Kumar",
    title: "2nd Responder",
    badge: "Campus Marshal & Escort",
    etaMinutes: 8,
    distanceKm: 2.1,
    rating: 4.90,
    verified: true,
    phone: "+91 98234 56789",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    skills: ["Security Escort", "Physical Safety"],
    location: { lat: 40.7680, lng: -74.1700 },
    explanation: "2.1 km away (8 min ETA) • Campus Security • Fast Response"
  },
  {
    id: "resp_sarah_03",
    name: "Dr. Sarah Khan",
    title: "3rd Responder",
    badge: "Emergency Medicine Physician",
    etaMinutes: 12,
    distanceKm: 3.4,
    rating: 4.98,
    verified: true,
    phone: "+91 98345 67890",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80",
    skills: ["Advanced Medical", "Triage Specialist"],
    location: { lat: 40.7550, lng: -74.1820 },
    explanation: "3.4 km away (12 min ETA) • Senior Physician • On-Duty"
  }
];

// Coordinates representing the scenario shown in the screenshot (Montclair Ave / Elliott St / Newark coordinates)
export const MAP_CONFIG = {
  center: [40.7635, -74.1725],
  userPos: [40.7610, -74.1685], // "You are here" marker
  responderPos: [40.7660, -74.1765], // "1st Responder" marker
  // Waypoint polyline matching the screenshot's red route
  routePoints: [
    [40.7660, -74.1765], // 1st Responder starting point
    [40.7645, -74.1740],
    [40.7628, -74.1718],
    [40.7640, -74.1705],
    [40.7610, -74.1685]  // You are here
  ]
};

export const QUICK_CATEGORIES = [
  { id: "medical", label: "Medical", color: "red", icon: "Activity" },
  { id: "harassment", label: "Harassment / Unsafe", color: "amber", icon: "ShieldAlert" },
  { id: "accident", label: "Accident", color: "rose", icon: "AlertTriangle" }
];

// Dynamically generate surrounding emergency hubs around the user's live coordinates
export function getSurroundingSafetyHubs(coords) {
  const lat = coords?.lat || MAP_CONFIG.userPos[0];
  const lng = coords?.lng || MAP_CONFIG.userPos[1];

  return [
    {
      id: "hub_hospital_01",
      name: "Emergency Trauma & Hospital Care",
      type: "hospital",
      icon: "🏥",
      category: "Medical Facility",
      distanceMeters: 420,
      etaMins: 2,
      location: { lat: lat + 0.0022, lng: lng + 0.0018 },
      address: "24/7 Casualty & Critical Trauma Unit",
      phone: "+91 80 2662 1000",
      status: "Open 24/7 · 3 Ambulances Ready"
    },
    {
      id: "hub_police_02",
      name: "City Police Rapid Action Post",
      type: "police",
      icon: "🚓",
      category: "Law Enforcement",
      distanceMeters: 580,
      etaMins: 3,
      location: { lat: lat - 0.0021, lng: lng + 0.0024 },
      address: "Sub-division Patrol Outpost",
      phone: "112",
      status: "Patrol Active · 2 PCR Vans Deployed"
    },
    {
      id: "hub_safezone_03",
      name: "Community Monitored Safe Zone",
      type: "safe_zone",
      icon: "🛡️",
      category: "Guarded Safe Haven",
      distanceMeters: 290,
      etaMins: 1,
      location: { lat: lat + 0.0014, lng: lng - 0.0022 },
      address: "Main Security Control & CCTV Point",
      phone: "+91 80 2662 2130",
      status: "Staffed 24x7 · SOS Beacon Active"
    },
    {
      id: "hub_fire_04",
      name: "Emergency Rescue & Fire Station",
      type: "fire_rescue",
      icon: "🚒",
      category: "Fire & Rescue",
      distanceMeters: 750,
      etaMins: 4,
      location: { lat: lat - 0.0028, lng: lng - 0.0019 },
      address: "Municipal Fire Control Base",
      phone: "101",
      status: "On-Duty Standby"
    }
  ];
}
