import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Only check for MONGODB_URI when actually connecting, not during build
  const MONGODB_URI = process.env.MONGODB_URI;
  
  // If no URI provided, use default for development or throw for production
  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Please define the MONGODB_URI environment variable');
    }
    // Use default for development/build
    const defaultUri = 'mongodb://localhost:27017/trackapply';
    console.warn('Using default MongoDB URI for development:', defaultUri);
  }

  const mongoUri = MONGODB_URI || 'mongodb://localhost:27017/trackapply';

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(mongoUri, opts);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default dbConnect; 