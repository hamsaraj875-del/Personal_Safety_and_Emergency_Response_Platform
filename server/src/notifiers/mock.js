import { NotificationLog } from '../models/NotificationLog.js';

export class MockNotifier {
  async sendPush({ incidentId, to, title, body, data }) {
    console.log(`[NOTIFIER:MOCK:PUSH] To: ${to} | ${title}: ${body}`);
    return await NotificationLog.create({
      incidentId: incidentId || 'system',
      channel: 'push',
      to: String(to),
      body: `${title}: ${body}`,
      driver: 'mock',
      status: 'SENT'
    });
  }

  async sendSms({ incidentId, to, body }) {
    console.log(`[NOTIFIER:MOCK:SMS] To: ${to} | Msg: ${body}`);
    return await NotificationLog.create({
      incidentId: incidentId || 'system',
      channel: 'sms',
      to: String(to),
      body,
      driver: 'mock',
      status: 'SENT'
    });
  }

  async sendVoice({ incidentId, to, message }) {
    console.log(`[NOTIFIER:MOCK:VOICE] To: ${to} | Audio: ${message}`);
    return await NotificationLog.create({
      incidentId: incidentId || 'system',
      channel: 'voice',
      to: String(to),
      body: message,
      driver: 'mock',
      status: 'SENT'
    });
  }
}
