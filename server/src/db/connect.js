import mongoose from 'mongoose';
import { env } from '../config/env.js';

let isConnected = false;

export async function connectDB(maxRetries = 5, retryDelayMs = 2000) {
  if (isConnected) return;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000
      });
      isConnected = true;
      console.log(`Connected to MongoDB Atlas database "${env.MONGODB_DB}"`);
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt === maxRetries) {
        throw new Error(`Unable to connect to MongoDB after ${maxRetries} attempts. Check Atlas IP Whitelist (add 0.0.0.0/0) or credentials.`);
      }
      await new Promise(res => setTimeout(res, retryDelayMs * attempt));
    }
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export async function closeDB() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
  }
}
