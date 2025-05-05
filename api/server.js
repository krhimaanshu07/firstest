// Serverless function for Vercel to handle all API requests
const express = require('express');
const { createServer } = require('http');

// Import the Express app
const { setupServer } = require('../server/vercel-setup');

// Initialize and cache the server
let cachedServer = null;

async function getServer() {
  if (cachedServer) {
    return cachedServer;
  }
  
  const app = express();
  const server = createServer(app);
  
  // Setup the Express server with all routes and middleware
  await setupServer(app, server);
  
  cachedServer = server;
  return server;
}

module.exports = async (req, res) => {
  const server = await getServer();
  
  // Handle the request with the Express app
  await new Promise((resolve, reject) => {
    server._events.request(req, res);
    res.on('finish', resolve);
    res.on('error', reject);
  });
};