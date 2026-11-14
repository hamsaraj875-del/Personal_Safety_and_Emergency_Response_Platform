import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../db/connect.js';
import { User } from '../models/User.js';
import { Contact } from '../models/Contact.js';
import { Responder } from '../models/Responder.js';
import { SafetyHub } from '../models/SafetyHub.js';
import { AuthorityOfficer } from '../models/AuthorityOfficer.js';
import { FleetVehicle } from '../models/FleetVehicle.js';
import { AnprDetection } from '../models/AnprDetection.js';
import { Hotspot } from '../models/Hotspot.js';
import { normalizePhone } from '../utils/phone.js';

export async function seedDatabase(forceClean = false) {
  await connectDB();

  console.log('--- Starting Idempotent Seeding ---');

  if (forceClean) {
    console.log('Force clean: dropping demo collections...');
    await Promise.all([
      User.deleteMany({}),
      Contact.deleteMany({}),
      Responder.deleteMany({}),
      SafetyHub.deleteMany({}),
      AuthorityOfficer.deleteMany({}),
      FleetVehicle.deleteMany({}),
      AnprDetection.deleteMany({}),
      Hotspot.deleteMany({})
    ]);
  }

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = 'password123';
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, salt);
  const safetyPinHash = await bcrypt.hash('1234', salt);
  const duressPinHash = await bcrypt.hash('9999', salt);

  // 1. Demo Citizen User (Jenifer Pilman)
  const citizenPhone = '+91 98765 43210';
  const citizenPhoneNorm = normalizePhone(citizenPhone);
  let citizen = await User.findOne({ phoneNormalized: citizenPhoneNorm });

  if (!citizen) {
    citizen = await User.create({
      _id: 'usr_jenifer_01',
      name: 'Jenifer Pilman',
      phone: citizenPhone,
      phoneNormalized: citizenPhoneNorm,
      email: 'jenifer.pilman@bmsce.ac.in',
      passwordHash: defaultPasswordHash,
      safetyPinHash,
      duressPinHash,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
      bloodGroup: 'O+',
      emergencyNotes: 'Asthma inhaler in backpack side pouch',
      address: 'BMSCE Campus, Bull Temple Rd, Basavanagudi, Bengaluru, KA 560019',
      role: 'citizen',
      settings: { demoMode: true, escalationSpeed: 'FAST' }
    });
    console.log('Seeded demo citizen: Jenifer Pilman');
  }

  // 2. Three Trusted Emergency Contacts
  const contactsData = [
    {
      _id: 'c_01',
      userId: citizen.id,
      name: 'Ananya Sharma',
      relation: 'Sister / Roommate',
      phone: '+91 98765 43211',
      priority: 1,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      consentGiven: true,
      status: 'Active'
    },
    {
      _id: 'c_02',
      userId: citizen.id,
      name: 'Rohan Verma',
      relation: 'Brother',
      phone: '+91 98765 43212',
      priority: 2,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      consentGiven: true,
      status: 'Active'
    },
    {
      _id: 'c_03',
      userId: citizen.id,
      name: 'Kavita Pilman',
      relation: 'Mother',
      phone: '+91 98765 43213',
      priority: 3,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      consentGiven: true,
      status: 'Active'
    }
  ];

  for (const c of contactsData) {
    const existing = await Contact.findById(c._id);
    if (!existing) {
      await Contact.create(c);
      console.log(`Seeded contact: ${c.name} (Priority ${c.priority})`);
    }
  }

  // 3. Three Responders
  const respondersData = [
    {
      _id: 'resp_emily_01',
      name: 'Emily Dayton',
      title: 'Trauma Paramedic',
      badge: 'EMS-991',
      skills: ['Advanced First Aid', 'CPR Certified', 'Trauma Stabilization'],
      category: 'Medical',
      phone: '+91 98765 43220',
      avatar: 'https://images.unsplash.com/photo-1594824813571-638f02638523?auto=format&fit=crop&w=256&q=80',
      rating: 4.9,
      verified: true,
      available: true,
      historicalResponseMinutes: 4,
      location: {
        type: 'Point',
        coordinates: [77.532, 12.9385]
      }
    },
    {
      _id: 'resp_arjun_02',
      name: 'Arjun Rao',
      title: 'Campus Patrol Leader',
      badge: 'SEC-402',
      skills: ['Physical Escort', 'De-escalation', 'Night Navigation'],
      category: 'Security',
      phone: '+91 98765 43221',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      rating: 4.7,
      verified: true,
      available: true,
      historicalResponseMinutes: 3,
      location: {
        type: 'Point',
        coordinates: [77.541, 12.931]
      }
    },
    {
      _id: 'resp_priya_03',
      name: 'Dr. Priya Nair',
      title: 'Emergency Medical Officer',
      badge: 'DOC-112',
      skills: ['Triage Management', 'Advanced Cardiac Life Support', 'Pediatric Care'],
      category: 'Medical',
      phone: '+91 98765 43222',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
      rating: 5.0,
      verified: true,
      available: true,
      historicalResponseMinutes: 5,
      location: {
        type: 'Point',
        coordinates: [77.545, 12.929]
      }
    }
  ];

  for (const r of respondersData) {
    const existing = await Responder.findById(r._id);
    if (!existing) {
      await Responder.create(r);
      console.log(`Seeded responder: ${r.name} (${r.badge})`);
    }
  }

  // 4. Four Safety Hubs
  const hubsData = [
    {
      _id: 'hub_01',
      name: 'Victoria Hospital Emergency Trauma Center',
      shortName: 'Victoria Hospital',
      type: 'hospital',
      icon: 'hospital',
      category: 'Level-1 Trauma & Burn Care Center',
      distanceMeters: 450,
      etaMins: 3,
      address: 'Fort Road, Near City Market, Kalasipalya, Bengaluru 560002',
      phone: '080-26701150',
      status: 'Open 24x7 · 14 ER Bays Active',
      openNow: true,
      openingHoursText: 'Open 24 Hours · Immediate Triage',
      isTraumaCenter: true,
      briefing: 'Full surgical triage, blood bank, and 24x7 neuro-trauma team available.',
      location: {
        type: 'Point',
        coordinates: [77.573, 12.963]
      }
    },
    {
      _id: 'hub_02',
      name: 'Basavanagudi Police Station',
      shortName: 'Basavanagudi Police',
      type: 'police',
      icon: 'police',
      category: 'Law Enforcement Command Post',
      distanceMeters: 800,
      etaMins: 5,
      address: 'Kavi Lakshmisha Road, Basavanagudi, Bengaluru 560004',
      phone: '080-22942542',
      status: 'Active Patrol Desk',
      openNow: true,
      openingHoursText: 'Open 24 Hours · Mobile Patrol Base',
      isTraumaCenter: false,
      briefing: 'Direct dispatch for Hoysala rapid-response PCR vans.',
      location: {
        type: 'Point',
        coordinates: [77.575, 12.942]
      }
    },
    {
      _id: 'hub_03',
      name: 'BMSCE Safe Zone & 24hr Campus Security Desk',
      shortName: 'BMSCE Safe Zone',
      type: 'safe_zone',
      icon: 'safe_zone',
      category: 'Verified Safe Sanctuary',
      distanceMeters: 150,
      etaMins: 1,
      address: 'Bull Temple Road, Basavanagudi, Bengaluru 560019',
      phone: '080-26622130',
      status: 'Guard Manned · CCTV Monitored',
      openNow: true,
      openingHoursText: 'Open 24 Hours · Security Escort Hub',
      isTraumaCenter: false,
      briefing: 'Illuminated perimeter with SOS emergency pillar and security escort.',
      location: {
        type: 'Point',
        coordinates: [77.565, 12.941]
      }
    },
    {
      _id: 'hub_04',
      name: 'South Fire & Rescue Headquarters',
      shortName: 'South Fire Station',
      type: 'fire_rescue',
      icon: 'fire_rescue',
      category: 'Fire & Hazmat Rescue',
      distanceMeters: 1200,
      etaMins: 7,
      address: 'Jayanagar 4th Block, Bengaluru 560011',
      phone: '101 / 080-22971500',
      status: 'Ready Response',
      openNow: true,
      openingHoursText: 'Open 24 Hours · Rescue & Extrication',
      isTraumaCenter: false,
      briefing: 'Equipped with hydraulic extrication tools and medical first response.',
      location: {
        type: 'Point',
        coordinates: [77.583, 12.929]
      }
    }
  ];

  for (const h of hubsData) {
    const existing = await SafetyHub.findById(h._id);
    if (!existing) {
      await SafetyHub.create(h);
      console.log(`Seeded safety hub: ${h.name}`);
    }
  }

  // 5. Authority Officer BLR-OPS-892
  const officerBadge = 'BLR-OPS-892';
  let officer = await AuthorityOfficer.findOne({ badgeId: officerBadge });
  if (!officer) {
    officer = await AuthorityOfficer.create({
      _id: 'off_blr_892',
      badgeId: officerBadge,
      passwordHash: defaultPasswordHash,
      name: 'Inspector Rajesh Gowda',
      sector: 'Bengaluru South Emergency Command',
      role: 'authority'
    });
    console.log(`Seeded authority officer: ${officer.name} (${officer.badgeId})`);
  }

  // 6. Six Fleet Vehicles
  const fleetData = [
    {
      vehicleNo: 'KA-01-EA-312',
      type: 'ALS Advanced Life Support',
      driver: 'Mahesh K.',
      status: 'Ready',
      location: { type: 'Point', coordinates: [77.531, 12.941] },
      fuel: '92%',
      depot: 'City Central Hospital Depot',
      isDisplaceCandidate: true
    },
    {
      vehicleNo: 'KA-01-EA-415',
      type: 'ALS Advanced Life Support',
      driver: 'Suresh Babu',
      status: 'Ready',
      location: { type: 'Point', coordinates: [77.534, 12.943] },
      fuel: '88%',
      depot: 'City Central Hospital Depot',
      isDisplaceCandidate: true
    },
    {
      vehicleNo: 'KA-05-EA-108',
      type: 'BLS Basic Life Support',
      driver: 'Venkatesh R.',
      status: 'Ready',
      location: { type: 'Point', coordinates: [77.545, 12.928] },
      fuel: '76%',
      depot: 'South Base Station',
      isDisplaceCandidate: false
    },
    {
      vehicleNo: 'KA-05-EA-991',
      type: 'BLS Basic Life Support',
      driver: 'Govindappa',
      status: 'Ready',
      location: { type: 'Point', coordinates: [77.525, 12.935] },
      fuel: '84%',
      depot: 'West Arterial Hub',
      isDisplaceCandidate: false
    },
    {
      vehicleNo: 'KA-01-EA-884',
      type: 'ALS Advanced Life Support',
      driver: 'Ramesh Nayak',
      status: 'Dispatched',
      location: { type: 'Point', coordinates: [77.548, 12.949] },
      fuel: '65%',
      depot: 'National College Station',
      isDisplaceCandidate: false
    },
    {
      vehicleNo: 'KA-01-EA-772',
      type: 'BLS Rapid First Responder',
      driver: 'Kiran Kumar',
      status: 'On Scene',
      location: { type: 'Point', coordinates: [77.528, 12.922] },
      fuel: '71%',
      depot: 'South End Circle Depot',
      isDisplaceCandidate: false
    }
  ];

  for (const f of fleetData) {
    const existing = await FleetVehicle.findOne({ vehicleNo: f.vehicleNo });
    if (!existing) {
      await FleetVehicle.create(f);
      console.log(`Seeded fleet vehicle: ${f.vehicleNo} (${f.type})`);
    }
  }

  // 7. Four ANPR Detections
  const anprData = [
    {
      plateNumber: 'KA-01-MJ-8921',
      vehicleModel: 'Black Toyota Fortuner',
      locationName: 'Outer Ring Rd Cam #04',
      speedKmh: 84,
      status: 'HIT & RUN ALERT',
      confidence: '99.4%',
      alertType: 'CRITICAL',
      reason: 'Matched description of pedestrian collision near Bull Temple Rd. Fled scene without stopping.',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
    },
    {
      plateNumber: 'KA-05-NB-4412',
      vehicleModel: 'White Hyundai Creta',
      locationName: 'National College Jn Cam #02',
      speedKmh: 42,
      status: 'FLAGGED STOLEN',
      confidence: '96.8%',
      alertType: 'HIGH',
      reason: 'FIR #492/2026 registered at Basavanagudi PS for unauthorized vehicle deprivation.',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80'
    },
    {
      plateNumber: 'KA-03-TR-9011',
      vehicleModel: 'Silver Maruti Ertiga',
      locationName: 'South End Circle Cam #01',
      speedKmh: 68,
      status: 'OVERSPEED IN SCHOOL ZONE',
      confidence: '98.1%',
      alertType: 'MEDIUM',
      reason: 'Automated radar captured 68 km/h in restricted 30 km/h emergency corridor zone.',
      image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=400&q=80'
    },
    {
      plateNumber: 'KA-04-P-3301',
      vehicleModel: 'Red Hero Splendor',
      locationName: 'Bull Temple Arterial Cam #03',
      speedKmh: 35,
      status: 'CLEAR',
      confidence: '99.8%',
      alertType: 'INFO',
      reason: 'Regular telemetry scan. No active warrants or speed violations detected.',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'
    }
  ];

  for (const a of anprData) {
    const existing = await AnprDetection.findOne({ plateNumber: a.plateNumber });
    if (!existing) {
      await AnprDetection.create(a);
      console.log(`Seeded ANPR record: ${a.plateNumber}`);
    }
  }

  // 8. Five Hotspots
  const hotspotsData = [
    {
      name: 'Outer Ring Rd & Bull Temple Junction',
      location: { type: 'Point', coordinates: [77.5358 - 0.008, 12.9352 + 0.014] },
      collisionCount: 24,
      riskLevel: 'CRITICAL',
      peakHours: '21:30 – 02:00',
      primaryCause: 'Night 2-wheeler speed differential & unlit median',
      radiusMeters: 450,
      trend: '+14% weekend surge',
      dangerScore: 92
    },
    {
      name: 'National College Metro Link',
      location: { type: 'Point', coordinates: [77.5358 + 0.012, 12.9352 - 0.009] },
      collisionCount: 16,
      riskLevel: 'HIGH',
      peakHours: '18:00 – 21:00',
      primaryCause: 'Pedestrian crossing rush & blind bus halt',
      radiusMeters: 350,
      trend: '-5% under patrol',
      dangerScore: 78
    },
    {
      name: 'Basavanagudi Market West Arterial',
      location: { type: 'Point', coordinates: [77.5358 - 0.006, 12.9352 - 0.018] },
      collisionCount: 11,
      riskLevel: 'HIGH',
      peakHours: '19:30 – 23:00',
      primaryCause: 'Mixed auto-rickshaw & delivery bike congestion',
      radiusMeters: 300,
      trend: '+8% this week',
      dangerScore: 72
    },
    {
      name: 'South End Circle Bottleneck',
      location: { type: 'Point', coordinates: [77.5358 + 0.021, 12.9352 + 0.008] },
      collisionCount: 8,
      riskLevel: 'MODERATE',
      peakHours: '13:30 – 16:00',
      primaryCause: 'Sudden left-turn weave from flyover slip road',
      radiusMeters: 250,
      trend: 'Stable',
      dangerScore: 60
    },
    {
      name: 'Lalbagh West Gate Highway Feed',
      location: { type: 'Point', coordinates: [77.5358 + 0.011, 12.9352 + 0.023] },
      collisionCount: 6,
      riskLevel: 'MODERATE',
      peakHours: '00:30 – 04:30',
      primaryCause: 'Heavy intercity freight truck blind spots',
      radiusMeters: 400,
      trend: '+4% late nights',
      dangerScore: 52
    }
  ];

  for (const h of hotspotsData) {
    const existing = await Hotspot.findOne({ name: h.name });
    if (!existing) {
      await Hotspot.create(h);
      console.log(`Seeded hotspot: ${h.name}`);
    }
  }

  console.log('\n========================================');
  console.log(' SEEDING COMPLETE — DEMO CREDENTIALS:');
  console.log('----------------------------------------');
  console.log(' Citizen Login:');
  console.log('   Phone:    +91 98765 43210');
  console.log('   Password: password123');
  console.log('   Safe PIN: 1234');
  console.log('   Duress:   9999');
  console.log(' Authority Login:');
  console.log('   Badge:    BLR-OPS-892');
  console.log('   Password: password123');
  console.log('========================================\n');
}

// When run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(process.argv.includes('--clean'))
    .then(() => closeDB())
    .catch(err => {
      console.error('Seed script failed:', err);
      process.exit(1);
    });
}
