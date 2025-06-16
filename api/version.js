// File: api/version.js
// Simple version endpoint (ES Module)

export default function handler(req, res) {
  res.status(200).json({
    name: 'CS Assessment System',
    version: '1.0.0',
    api: true
  });
}
