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
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true
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
    await import('../dist/server/models.js');
  } catch (err) {
    console.error('Error loading models:', err);
  }

  // 5. Setup authentication
  try {
    const { setupAuth } = await import('../dist/server/auth.js');
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
    const routesModule = await import('../dist/server/routes.js');
    await routesModule.registerRoutes(app);
  } catch (err) {
    console.error('Error registering routes:', err);
  }

  // 8. Error handler
  app.use((err, req, res, next) => {
    console.error('API Error:', err);
    const statusCode = err.statusCode || 500;
    const errorResponse = {
      error: err.name || 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    };
    res.status(statusCode).json(errorResponse);
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
    const statusCode = error.statusCode || 500;
    const errorResponse = {
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    };
    res.status(statusCode).json(errorResponse);
  }
}

// 10. (Optional) Configure Vercel function settings
export const config = { memory: 1024, maxDuration: 10 };
