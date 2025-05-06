// File: api/health.js
// Simple health check endpoint (ES Module)

export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
