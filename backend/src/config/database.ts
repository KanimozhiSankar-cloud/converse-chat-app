import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.mongoUri);
    const conversationIndexes = await mongoose.connection.collection('conversations').indexes();
    const staleVisibilityIndex = conversationIndexes.find((index) => {
      const fields = Object.keys(index.key ?? {}).sort();
      return fields.length === 2 && fields[0] === 'hiddenFor' && fields[1] === 'participants';
    });
    if (staleVisibilityIndex?.name) {
      await mongoose.connection.collection('conversations').dropIndex(staleVisibilityIndex.name);
      console.log(`[database] Removed stale conversation index ${staleVisibilityIndex.name}`);
    }
    console.log(`[database] Connected to MongoDB at ${env.mongoUri}`);
  } catch (error) {
    console.error('[database] Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[database] MongoDB connection lost');
  });
}
