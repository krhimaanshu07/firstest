// File: api/hello.js
// Simple test API endpoint for Vercel (ES Module)

export default function handler(req, res) {
  res.status(200).json({ message: 'Hello, Vercel!' });
}
