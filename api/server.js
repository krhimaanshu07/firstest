// File: api/server.js (ES Module)
// Serverless function for Vercel to handle all API requests

import express from 'express';
import { createServer } from 'http';
import 'dotenv/config';

// Import MongoDB connection
import { connectToMongoDB } from '../server/mongodb-vercel.js';

// Import the Express app setup
import { setupServer } from '../server/vercel-setup.js';

// Initialize and cache the server
let cachedServer = null;

async function getServer() {
  if (cachedServer) {
    return cachedServer;
  }

  try {
    // Connect to MongoDB first
    await connectToMongoDB();

    // Now set up the Express server
    const app = express();
    const server = createServer(app);

    // Setup the Express server with all routes and middleware
    await setupServer(app, server);

    cachedServer = server;
    return server;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}

// Export the serverless function handler
export default async function handler(req, res) {
  try {
    const server = await getServer();

    // Handle the request with the Express app
    await new Promise((resolve, reject) => {
      server._events.request(req, res);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Optional: configure Vercel function settings
export const config = { memory: 1024, maxDuration: 10 };
