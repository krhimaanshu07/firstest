// Main API entrypoint for Vercel serverless function
const serverHandler = require('./server');

// This is the serverless function entry point for Vercel
module.exports = async (req, res) => {
  // Forward to our server.js handler
  return serverHandler(req, res);
};