import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Connect to MongoDB memory server
export async function connectToMongoDB() {
  try {
    // Create an in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Memory Server successfully');
    
    // Initialize session store with the connected client
    const { storage } = await import('./storage');
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

// Disconnect and stop the MongoDB memory server
export async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from MongoDB Memory Server');
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
  }
}

export default mongoose;