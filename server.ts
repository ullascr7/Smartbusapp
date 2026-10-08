import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import authRouter from './server/routes/auth.ts';
import locationsRouter from './server/routes/locations.ts';
import distanceRouter from './server/routes/distance.ts';
import busesRouter from './server/routes/buses.ts';
import bookingsRouter from './server/routes/bookings.ts';
import userRouter from './server/routes/user.ts';
import adminRouter from './server/routes/admin.ts';
import trackingRouter from './server/routes/tracking.ts';
import aiRouter from './server/routes/ai.ts';
import depotsRouter from './server/routes/depots.ts';
import { initWebSocketServer } from './server/services/websocket.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

