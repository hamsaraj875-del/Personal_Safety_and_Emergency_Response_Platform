import { env } from '../config/env.js';
import { MockNotifier } from './mock.js';
import { FcmNotifier } from './fcm.js';
import { TwilioNotifier } from './twilio.js';

let notifierInstance = null;

export function getNotifier() {
  if (!notifierInstance) {
    if (env.NOTIFIER_DRIVER === 'fcm' && env.FCM_SERVICE_ACCOUNT_JSON) {
      notifierInstance = new FcmNotifier(env.FCM_SERVICE_ACCOUNT_JSON);
    } else if (env.NOTIFIER_DRIVER === 'twilio' && env.TWILIO_SID && env.TWILIO_TOKEN) {
      notifierInstance = new TwilioNotifier(env.TWILIO_SID, env.TWILIO_TOKEN, env.TWILIO_FROM);
    } else {
      notifierInstance = new MockNotifier();
    }
  }
  return notifierInstance;
}
