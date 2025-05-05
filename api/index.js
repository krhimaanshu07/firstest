// Main API entrypoint for Vercel
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// This will be the serverless function for Vercel
module.exports = async (req, res) => {
  // Forward to our server.js function
  require('./server')(req, res);
};