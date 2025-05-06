// File: server/mongodb-vercel.js
// ES Module version of your MongoDB connection util

import mongoose from 'mongoose';
import 'dotenv/config';
import { storage } from './storage.js';  // adjust path/extension as needed

let cachedConnection = null;

export async function connectToMongoDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGO_DB;
  if (!mongoUri) {
    throw new Error('MONGO_DB environment variable is not set');
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('Connected to MongoDB Atlas successfully');

    cachedConnection = connection;

    // Initialize the session store if provided
    if (storage?.initSessionStore) {
      storage.initSessionStore(mongoose.connection.getClient());
    }

    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
