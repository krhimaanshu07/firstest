// File: api/[...slug].js
// Catch-all API handler converted to ES modules

import './resolver.cjs';         // Rename resolver.js → resolver.cjs
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStorePkg from 'connect-mongo';
const MongoStore = MongoStorePkg.create;
import path from 'path';
import cors from 'cors';
import 'dotenv/config';

let app = null;
let isSetup = false;

async function setupApp() {
  if (isSetup) return app;

  // Connect to MongoDB
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

  app = express();

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:5000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session store
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
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.VERCEL_URL : undefined
    },
  }));

  // Load models (side-effects)
  try {
    await import('../dist/server/models/index.js');
  } catch (err) {
    console.error('Error loading models:', err);
  }

  // Setup auth
  try {
    const { setupAuth } = await import('../dist/server/auth/index.js');
    setupAuth(app);
  } catch (err) {
    console.error('Error setting up auth:', err);
    app.get('/api/auth/status', (req, res) => {
      res.json({ authenticated: req.isAuthenticated?.() || false });
    });
  }

  // Health check
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // Register application routes
  try {
    const routesModule = await import('../dist/server/routes/index.js');
    await routesModule.registerRoutes(app);
  } catch (err) {
    console.error('Error registering routes:', err);
  }

  // Error handler
  app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  isSetup = true;
  return app;
}

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
