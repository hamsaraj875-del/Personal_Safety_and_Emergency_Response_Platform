export class TriageService {
  /**
   * Scrub PII from text before logging or analysis
   */
  static scrubPII(text = '', knownNames = []) {
    if (!text) return '';
    let scrubbed = text;

    // Remove phone numbers (+91..., 10 digits)
    scrubbed = scrubbed.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');
    scrubbed = scrubbed.replace(/\b\d{10}\b/g, '[PHONE_REDACTED]');

    // Remove emails
    scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');

    // Remove street addresses & pincodes
    scrubbed = scrubbed.replace(/\b\d{6}\b/g, '[PINCODE_REDACTED]');
    scrubbed = scrubbed.replace(/\b(street|st|road|rd|cross|main|avenue|ave|lane|layout|nagar|colony|block|sector)\b/gi, '[STREET_REDACTED]');

    // Remove known contact names
    for (const name of knownNames) {
      if (name && name.length > 2) {
        const reg = new RegExp(`\\b${name}\\b`, 'gi');
        scrubbed = scrubbed.replace(reg, '[NAME_REDACTED]');
      }
    }

    return scrubbed;
  }

  /**
   * Deterministic keyword triage engine
   */
  static triageText(text = '') {
    const lower = (text || '').toLowerCase();

    // Critical Level 5
    if (
      lower.includes('unconscious') ||
      lower.includes('severe bleeding') ||
      lower.includes('weapon') ||
      lower.includes('gun') ||
      lower.includes('knife') ||
      lower.includes('cardiac') ||
      lower.includes('heart attack') ||
      lower.includes('kidnap')
    ) {
      return {
        severity: 5,
        category: 'Critical Life Threat',
        recommendedResponder: 'Medical / Armed Security',
        confidence: '95%'
      };
    }

    // High Level 4
    if (
      lower.includes('accident') ||
      lower.includes('hit and run') ||
      lower.includes('fracture') ||
      lower.includes('chasing') ||
      lower.includes('follow') ||
      lower.includes('stalk') ||
      lower.includes('harass') ||
      lower.includes('fire')
    ) {
      return {
        severity: 4,
        category: lower.includes('accident') ? 'Road Traffic Collision' : 'Harassment & Safety Threat',
        recommendedResponder: lower.includes('accident') ? 'ALS Ambulance' : 'Campus Security Escort',
        confidence: '91%'
      };
    }

    // Moderate Level 3
    if (
      lower.includes('pain') ||
      lower.includes('dizzy') ||
      lower.includes('fall') ||
      lower.includes('lost') ||
      lower.includes('dark') ||
      lower.includes('unsafe') ||
      lower.includes('suspicious')
    ) {
      return {
        severity: 3,
        category: 'Suspicious Activity / Medical Aid',
        recommendedResponder: 'First Aid Volunteer / Patrol',
        confidence: '84%'
      };
    }

    // Low Level 2
    return {
      severity: 2,
      category: 'General Precautionary SOS',
      recommendedResponder: 'Community Safety Officer',
      confidence: '78%'
    };
  }
}
