// Vercel Serverless Function
const express = require('express');
const { createServer } = require('http');
const { connectToMongoDB } = require('../dist/server/mongodb-vercel');
const { setupServer } = require('../dist/server/vercel-setup');
require('dotenv').config();

// Initialize Express instance (will be cached between invocations)
let app = null;
let isSetup = false;

// Create and configure the Express application
async function setupApp() {
  if (isSetup) return app;
  
  try {
    // Connect to MongoDB Atlas
    await connectToMongoDB();
    
    // Create Express app
    app = express();
    const server = createServer(app);
    
    // Configure the app with all middleware and routes
    await setupServer(app, server);
    
    isSetup = true;
    return app;
  } catch (error) {
    console.error('Error setting up Express app:', error);
    throw error;
  }
}

// Vercel serverless handler
module.exports = async (req, res) => {
  // Set CORS headers for API requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Set up the app on first request
    const expressApp = await setupApp();
    
    // Use Express to handle the incoming request
    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      expressApp(req, res);
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};