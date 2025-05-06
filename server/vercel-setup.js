// File: server/vercel-setup.js
// ES Module version of your Vercel-specific server setup

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { setupAuth } from './auth.js';
import { createTestUsers } from './setup-test-users.js';
import { registerRoutes } from './routes.js';

/**
 * Sets up the Express server with middleware, routes, and static file handling.
 * @param {import('express').Express} app - The Express application instance.
 * @param {import('http').Server} server - The HTTP server (unused here but available).
 * @returns {import('express').Express} The configured Express app.
 */
export async function setupServer(app, server) {
  // 1. Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // 2. Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse;

    // Monkey-patch res.json to capture the JSON payload
    const originalJson = res.json.bind(res);
    res.json = (body, ...rest) => {
      capturedJsonResponse = body;
      return originalJson(body, ...rest);
    };

    res.on('finish', () => {
      if (reqPath.startsWith('/api')) {
        const duration = Date.now() - start;
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        console.log(logLine.length > 80 ? logLine.slice(0, 79) + '…' : logLine);
      }
    });

    next();
  });

  // 3. Create test users (if applicable)
  await createTestUsers();

  // 4. Authentication setup
  setupAuth(app);

  // 5. Register application routes
  await registerRoutes(app);

  // 6. Error handling middleware
  app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Internal Server Error' });
  });

  // 7. Serve static assets from the client build
  app.use(express.static(path.join(process.cwd(), 'dist')));

  // 8. Catch-all for client-side routing (non-API routes)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    } else {
      res.status(404).json({ message: 'API endpoint not found' });
    }
  });

  return app;
}
