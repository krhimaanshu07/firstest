// Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

// Server instance (will be cached between invocations)
let server = null;

async function createServer() {
  if (server) return server;
  
  // Create Express app
  const app = express();
  
  // Basic middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Connect to MongoDB
  try {
    const mongoUri = process.env.MONGO_DB;
    if (!mongoUri) {
      throw new Error('MONGO_DB environment variable not set');
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('Connected to MongoDB Atlas');
    
    // Setup session with MongoDB store
    const sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 // 1 day
    });
    
    app.use(session({
      secret: process.env.SESSION_SECRET || 'computer-science-assessment-secret',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      }
    }));
    
    // Import models
    const models = require('../server/models');
    
    // Setup authentication routes
    const { setupAuth } = require('../server/auth');
    setupAuth(app);
    
    // Setup API routes
    const { registerRoutes } = require('../server/routes');
    await registerRoutes(app);
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('API Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
    
    server = app;
    return app;
  } catch (error) {
    console.error('Failed to create server:', error);
    throw error;
  }
}

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Create/get the server
    const app = await createServer();
    
    // Handle the request with Express
    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      
      app(req, res, (err) => {
        if (err) {
          console.error('Express error:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};