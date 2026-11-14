/**
 * Canonical JSON serializer for cryptographic hashing.
 * Recursively sorts object keys and serializes without whitespace or HTML escaping.
 */
export function canonicalJson(obj) {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return JSON.stringify(obj);
  }
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalJson(item));
    return `[${items.join(',')}]`;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
    const pairs = keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
    return `{${pairs.join(',')}}`;
  }
  return JSON.stringify(obj);
}
