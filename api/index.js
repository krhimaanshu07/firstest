// File: api/server.js (keep as .js for ESM)
// Vercel Serverless Function Entry Point (ES Module)

import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import connectMongoPkg from 'connect-mongo';
const MongoStore = connectMongoPkg.create;
import cors from 'cors';
import 'dotenv/config';

let app = null;
let isSetup = false;

async function setupApp() {
  if (isSetup) return app;

  // 1. Connect to MongoDB Atlas
  const mongoUri = process.env.MONGO_DB;
  if (!mongoUri) {
    throw new Error('MONGO_DB environment variable not set');
  }
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Atlas');
  }

  // 2. Create Express app
  app = express();
  app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. Session middleware
  const sessionStore = MongoStore({
    client: mongoose.connection.getClient(),
    collectionName: 'sessions',
    ttl: 60 * 60 * 24, // 1 day
  });
  app.use(session({
    secret: process.env.SESSION_SECRET || 'computer-science-assessment-secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  }));

  // 4. Load models (side-effect)
  try {
    await import('../dist/server/models/index.js');
  } catch (err) {
    console.error('Error loading models:', err);
  }

  // 5. Setup authentication
  try {
    const { setupAuth } = await import('../dist/server/auth/index.js');
    setupAuth(app);
  } catch (err) {
    console.error('Error setting up auth:', err);
  }

  // 6. Basic health route
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  // 7. Register custom routes
  try {
    const routesModule = await import('../dist/server/routes/index.js');
    await routesModule.registerRoutes(app);
  } catch (err) {
    console.error('Error registering routes:', err);
  }

  // 8. Error handler
  app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  isSetup = true;
  return app;
}

// 9. Export the serverless function handler
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  try {
    const expressApp = await setupApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
  }
}

// 10. (Optional) Configure Vercel function settings
export const config = { memory: 1024, maxDuration: 10 };
