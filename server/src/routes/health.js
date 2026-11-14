import express from 'express';
import { isDbConnected } from '../db/connect.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const mongoUp = isDbConnected();
  res.status(mongoUp ? 200 : 503).json({
    ok: mongoUp,
    mongo: mongoUp ? 'up' : 'down',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

export default router;
