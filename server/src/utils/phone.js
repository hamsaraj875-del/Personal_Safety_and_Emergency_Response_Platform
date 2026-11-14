/**
 * Normalize phone numbers to standard format
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  // Remove non-digit characters except leading plus
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+91' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}
