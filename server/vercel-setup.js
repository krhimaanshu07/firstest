// Vercel-specific server setup
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { registerRoutes } = require('./routes');
const { setupAuth } = require('./auth');
const { connectToMongoDB } = require('./mongodb');
const path = require('path');

// Function to set up the server for Vercel deployment
async function setupServer(app, server) {
  // Set up middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Connect to MongoDB
  await connectToMongoDB();
  
  // Create test users after MongoDB is connected
  const { createTestUsers } = require('./setup-test-users');
  await createTestUsers();
  
  // Setup authentication
  setupAuth(app);
  
  // Register routes
  await registerRoutes(app);
  
  // Error handling middleware
  app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  
  // Serve static files
  app.use(express.static(path.join(process.cwd(), 'dist')));
  
  // Catch-all route to serve index.html for client-side routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    } else {
      res.status(404).json({ message: 'API endpoint not found' });
    }
  });
  
  return app;
}

module.exports = { setupServer };