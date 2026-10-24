import mongoose from "mongoose";

/**
 * Serverless-safe MongoDB connection.
 *
 * On Vercel each invocation may run in a warm container, so we cache the
 * connection (and the in-flight promise) on `globalThis` to avoid opening a
 * new pool on every request. Concurrent cold-start requests share one promise.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache =
  global.mongooseCache ?? (global.mongooseCache = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      // Serverless: avoid buffering commands without a connection
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
    console.log("[db] MongoDB connected");
    return cache.conn;
  } catch (error) {
    // Reset so the next request can retry instead of caching a rejection
    cache.promise = null;
    cache.conn = null;
    console.error("[db] MongoDB connection error:", error);
    throw error;
  }
}
