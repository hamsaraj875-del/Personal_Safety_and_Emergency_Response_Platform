/**
 * Realtime WebSocket Client with Auto-Reconnect & 3-second Polling Fallback
 */

import { authStorage, api } from './api.js';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';

class SocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // event -> Set(callbacks)
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimeout = null;
    this.pollInterval = null;
    this.isConnected = false;
    this.isPolling = false;
    this.subscribedIncidents = new Set();
  }

  connect() {
    const token = authStorage.getToken();
    if (!token) {
      console.warn('[WS] Cannot connect: No auth token in memory.');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
    console.log(`[WS] Connecting to ${WS_BASE_URL}...`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected successfully.');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.stopPollingFallback();
        this.triggerEvent('connection.status', { connected: true, mode: 'websocket' });

        // Resubscribe to any active incident rooms
        for (const incId of this.subscribedIncidents) {
          this.send('subscribe', { incidentId: incId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;
          if (type) {
            this.triggerEvent(type, payload);
          }
        } catch (e) {
          console.error('[WS] Failed to parse message:', event.data, e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Socket error encountered:', err);
      };

      this.ws.onclose = () => {
        console.warn('[WS] Connection closed.');
        this.isConnected = false;
        this.triggerEvent('connection.status', { connected: false, mode: 'offline' });
        this.scheduleReconnect();
        this.startPollingFallback();
      };
    } catch (err) {
      console.error('[WS] Error initializing WebSocket:', err);
      this.startPollingFallback();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  startPollingFallback() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log('[WS] Initiating 3-second HTTP polling fallback...');
    this.triggerEvent('connection.status', { connected: false, mode: 'polling' });

    this.pollInterval = setInterval(async () => {
      if (this.isConnected) {
        this.stopPollingFallback();
        return;
      }
      try {
        const sectorData = await api.get('/authority/sector');
        this.triggerEvent('sector.poll', sectorData);
      } catch (err) {
        // Server unreachable during poll
      }
    }, 3000);
  }

  stopPollingFallback() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  subscribeIncident(incidentId) {
    this.subscribedIncidents.add(incidentId);
    this.send('subscribe', { incidentId });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  triggerEvent(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (e) {
          console.error(`[WS] Error in event listener for "${event}":`, e);
        }
      }
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopPollingFallback();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscribedIncidents.clear();
  }
}

export const socketService = new SocketService();
