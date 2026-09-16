/**
 * Optional helper to seed the database with a few demo users so you
 * can log in immediately without registering manually.
 *
 * Usage: npm run seed   (from the backend/ directory)
 */
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import mongoose from 'mongoose';

const demoUsers = [
  { name: 'Ava Chen', email: 'ava@example.com', password: 'password123' },
  { name: 'Liam Torres', email: 'liam@example.com', password: 'password123' },
  { name: 'Maya Patel', email: 'maya@example.com', password: 'password123' },
  { name: 'Noah Kim', email: 'noah@example.com', password: 'password123' },
];

async function seed() {
  await connectDatabase();

  for (const demo of demoUsers) {
    const existing = await User.findOne({ email: demo.email });
    if (existing) {
      console.log(`[seed] ${demo.email} already exists, skipping`);
      continue;
    }
    await User.create(demo);
    console.log(`[seed] Created ${demo.email} (password: ${demo.password})`);
  }

  await mongoose.connection.close();
  console.log('[seed] Done. You can now log in with any of the accounts above.');
}

seed().catch((error) => {
  console.error('[seed] Failed:', error);
  process.exit(1);
});
