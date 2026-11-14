export function buildErss112Payload(incident, user, ledgerBlocks = []) {
  const [lng, lat] = incident.location?.coordinates || [77.5358, 12.9352];

  return {
    agency: 'ERSS-112-Karnataka',
    cadIncidentNumber: `ERSS-BLR-${incident.code.replace('INC-', '')}`,
    internalIncidentId: incident.id,
    timestamp: new Date().toISOString(),
    callerDetails: {
      name: incident.userName,
      phone: incident.userPhone,
      bloodGroup: user?.bloodGroup || 'Unknown',
      medicalNotes: user?.emergencyNotes || 'None'
    },
    incidentDetails: {
      category: incident.category || 'General SOS',
      severity: incident.severity,
      duress: incident.duress,
      initialAddress: incident.address,
      coordinates: {
        latitude: lat,
        longitude: lng
      },
      speedProfile: incident.speedProfile,
      assignedResponder: incident.assignedResponder || null
    },
    auditTrail: {
      blockCount: ledgerBlocks.length,
      latestHash: ledgerBlocks.length > 0 ? ledgerBlocks[ledgerBlocks.length - 1].hash : null,
      verificationStatus: 'CRYPTO_CHAIN_AUTHENTICATED'
    },
    dispatchDirective: {
      priority: incident.severity >= 4 ? 'IMMEDIATE_RED' : 'STANDARD_AMBER',
      nearestPsJurisdiction: 'Basavanagudi Police Sub-Division',
      nearestHospital: 'KIMS Multi-Speciality Trauma Center'
    }
  };
}
