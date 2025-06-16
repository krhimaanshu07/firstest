import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupMongoDBCollections } from './mongodb-setup.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
export async function connectToMongoDB() {
  try {
    // Use the provided MongoDB Atlas connection string
    const mongoUri = process.env.MONGO_DB || 'mongodb+srv://vermaravifzd022:10EULEvReB6fdhyW@cluster0.g2bvjbh.mongodb.net/assessment?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUri, {
      // These options help with connection reliability
      serverSelectionTimeoutMS: 5000, // Give up initial connection after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    console.log('Connected to MongoDB Atlas successfully');
    
    // Set up collections and indexes for Atlas connection
    await setupMongoDBCollections();
    
    // Initialize session store with the connected client
    const { storage } = await import('./storage.js');
    if ('initSessionStore' in storage) {
      storage.initSessionStore(mongoose.connection.getClient());
      console.log('MongoDB session store initialized successfully');
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Disconnect from MongoDB
export async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
  }
}

export default mongoose;