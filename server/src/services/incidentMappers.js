export function toAuthorityIncident(incident) {
  const value = incident?.toObject ? incident.toObject() : { ...incident };
  const [lng, lat] = value.location?.coordinates || [77.5358, 12.9352];
  const location = { lat, lng };
  return { ...value, id: value.id || value._id, personName: value.userName, location, coordinates: location, categoryLabel: value.category || 'General Emergency', escalationStep: value.ladder?.step || 1 };
}

export function toCitizenIncident(incident) {
  const value = incident?.toObject ? incident.toObject() : { ...incident };
  for (const key of ['trackingToken', 'failedPinAttempts', 'pinLockedUntil', 'handoff112']) delete value[key];
  if (value.duress) value.clientStatus = 'RESOLVED';
  return value;
}
