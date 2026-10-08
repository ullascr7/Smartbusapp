import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import authRouter from './server/routes/auth.js';
import locationsRouter from './server/routes/locations.js';
import distanceRouter from './server/routes/distance.js';
import busesRouter from './server/routes/buses.js';
import bookingsRouter from './server/routes/bookings.js';
import userRouter from './server/routes/user.js';
import adminRouter from './server/routes/admin.js';
import trackingRouter from './server/routes/tracking.js';
import aiRouter from './server/routes/ai.js';
import depotsRouter from './server/routes/depots.js';
import { initWebSocketServer } from './server/services/websocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/distance', distanceRouter);
  app.use('/api/buses', busesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/user', userRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/tracking', trackingRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/depots', depotsRouter);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SmartBus AI',
      time: new Date().toISOString()
    });
  });

  // Vite middleware for development vs Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  initWebSocketServer(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartBus AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

