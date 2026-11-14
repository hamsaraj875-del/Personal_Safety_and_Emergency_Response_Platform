import { MockNotifier } from './mock.js';

export class TwilioNotifier extends MockNotifier {
  constructor(sid, token, from) {
    super();
    this.configured = !!(sid && token && from);
    if (this.configured) {
      console.log('[NOTIFIER:TWILIO] Twilio credentials provided.');
    }
  }

  async sendSms(params) {
    if (!this.configured) {
      return super.sendSms(params);
    }
    return super.sendSms(params);
  }

  async sendVoice(params) {
    if (!this.configured) {
      return super.sendVoice(params);
    }
    return super.sendVoice(params);
  }
}
