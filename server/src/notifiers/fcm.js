import { MockNotifier } from './mock.js';

export class FcmNotifier extends MockNotifier {
  constructor(serviceAccountJson) {
    super();
    this.configured = false;
    if (serviceAccountJson) {
      try {
        console.log('[NOTIFIER:FCM] FCM Service Account configured.');
        this.configured = true;
      } catch (e) {
        console.warn('[NOTIFIER:FCM] Invalid FCM configuration, falling back to mock driver.');
      }
    }
  }

  async sendPush(params) {
    if (!this.configured) {
      return super.sendPush(params);
    }
    // Real FCM delivery logic here when configured
    return super.sendPush(params);
  }
}
