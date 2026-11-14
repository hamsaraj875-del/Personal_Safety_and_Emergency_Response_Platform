import http from 'node:http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB, closeDB } from './db/connect.js';
import { initWebSocketServer, closeWebSocketServer } from './realtime/ws.js';
import { startEscalationScheduler, stopEscalationScheduler } from './services/escalationScheduler.js';
import { seedDatabase } from './seed/seed.js';
import { errorHandler } from './middleware/error.js';
import { globalLimiter } from './middleware/rateLimit.js';

// Route imports
import healthRoute from './routes/health.js';
import authRoute from './routes/auth.js';
import meRoute from './routes/me.js';
import contactsRoute from './routes/contacts.js';
import incidentsRoute from './routes/incidents.js';
import respondersRoute from './routes/responders.js';
import hubsRoute from './routes/hubs.js';
import trackRoute from './routes/track.js';
import authorityRoute from './routes/authority.js';
import demoRoute from './routes/demo.js';

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

// Security & Parsing
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  if (req.path === '/health' || (req.method === 'POST' && /^\/api\/v1\/incidents\/[^/]+\/location$/.test(req.path))) return next();
  return globalLimiter(req, res, next);
});

// Public Health & Tracking Routes
app.use(healthRoute);
app.use(trackRoute); // Mounts /t/:token (HTML) and /api/v1/track/:token

// API v1 Routes
const apiV1 = express.Router();
apiV1.use(healthRoute);
apiV1.use(authRoute);
apiV1.use(meRoute);
apiV1.use(contactsRoute);
apiV1.use(incidentsRoute);
apiV1.use(respondersRoute);
apiV1.use(hubsRoute);
apiV1.use(trackRoute);
apiV1.use(authorityRoute);
apiV1.use(demoRoute);

app.use('/api/v1', apiV1);

// Standard Error Handler
app.use(errorHandler);

// Boot function
async function boot() {
  try {
    console.log('--- Starting Jaagruth Emergency Platform Server ---');
    console.log(`Node: ${process.version} | Mode: ${env.NODE_ENV} | Demo: ${env.DEMO_MODE}`);
    if (/placeholder|change.?me|secret123|your.?secret/i.test(env.JWT_SECRET)) console.warn('WARNING: JWT_SECRET appears to be a placeholder. Replace it before exposing this server.');
    if (env.PUBLIC_BASE_URL.includes('localhost') && env.NOTIFIER_DRIVER !== 'mock') console.warn('WARNING: PUBLIC_BASE_URL contains localhost while notifications are enabled.');

    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Seed database if configured
    if (env.SEED_DEMO) {
      await seedDatabase(false);
    }

    // 3. Attach Raw WebSocket Server
    initWebSocketServer(server);
    console.log('WebSocket server mounted on /ws');

    // 4. Start Escalation Scheduler
    startEscalationScheduler();

    // 5. Start HTTP Server
    server.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT} (${env.PUBLIC_BASE_URL})`);
      console.log(`Health Check: GET ${env.PUBLIC_BASE_URL}/health`);
      console.log(`REST API:     ${env.PUBLIC_BASE_URL}/api/v1`);
      console.log(`WebSocket:    ws://localhost:${env.PORT}/ws?token=JWT`);
    });
  } catch (err) {
    console.error('Fatal boot error:', err.message);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  stopEscalationScheduler();
  closeWebSocketServer();
  server.close(async () => {
    console.log('HTTP server closed.');
    await closeDB();
    console.log('MongoDB connection closed. Process exiting.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

boot();
