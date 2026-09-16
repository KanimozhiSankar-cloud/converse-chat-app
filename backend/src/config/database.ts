import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[database] Connected to MongoDB at ${env.mongoUri}`);
  } catch (error) {
    console.error('[database] Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[database] MongoDB connection lost');
  });
}
