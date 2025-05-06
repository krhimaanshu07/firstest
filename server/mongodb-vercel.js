// File: server/mongodb-vercel.js
// ES-Module version of your MongoDB connection util

import mongoose from 'mongoose';
import 'dotenv/config';

// If you’re initializing a session store in storage.js, it needs to be ESM too:
import { storage } from './storage.js';

let cachedConnection = null;

/**
 * Connects (and caches) a Mongoose client to MongoDB Atlas.
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectToMongoDB() {
  if (cachedConnection) return cachedConnection;

  const mongoUri = process.env.MONGO_DB;
  if (!mongoUri) {
    throw new Error('MONGO_DB environment variable is not set');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('Connected to MongoDB Atlas successfully');

    cachedConnection = conn;

    // Initialize your session store if you have one
    if (storage?.initSessionStore) {
      storage.initSessionStore(mongoose.connection.getClient());
    }

    return conn;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}
