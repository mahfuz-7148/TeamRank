import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }
  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected");
  } catch (error) {
    console.error("[db] MongoDB connection error:", error);
    process.exit(1);
  }
}
