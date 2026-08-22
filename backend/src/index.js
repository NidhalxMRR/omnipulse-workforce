import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { initWebSocketServer } from './services/websocket.js';
import heartbeatRouter from './routes/heartbeat.js';
import agentsRouter from './routes/agents.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/heartbeat', heartbeatRouter);
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Initialize DB and WebSocket
async function startServer() {
  await initDb();
  initWebSocketServer(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Workforce Tracking Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
