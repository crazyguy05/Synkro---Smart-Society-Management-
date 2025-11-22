import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/user.js';
import Bill from './models/bill.js';
import Reward from './models/reward.js';
import Notice from './models/notice.js';

dotenv.config();

async function run() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Bill.deleteMany({}),
    Reward.deleteMany({}),
    Notice.deleteMany({}),
  ]);

  const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password', role: 'admin' });
  const resident1 = await User.create({ name: 'Resident 1', email: 'resident1@example.com', password: 'password', role: 'resident', apartment: 'A-101' });
  const resident2 = await User.create({ name: 'Resident 2', email: 'resident2@example.com', password: 'password', role: 'resident', apartment: 'A-102' });
  const resident3 = await User.create({ name: 'Resident 3', email: 'resident3@example.com', password: 'password', role: 'resident', apartment: 'A-103' });
  const guard = await User.create({ name: 'Guard One', email: 'guard@example.com', password: 'password', role: 'guard' });
  const staff = await User.create({ name: 'Staff One', email: 'staff@example.com', password: 'password', role: 'staff' });

  await Bill.create([
    { resident: resident1._id, month: '2025-10', maintenance: 1500, electricity: 900, water: 300, paid: false },
    { resident: resident1._id, month: '2025-09', maintenance: 1500, electricity: 850, water: 300, paid: true },
  ]);

  await Reward.create({ resident: resident1._id, points: 120, badges: ['On-Time Payer'] });
  await Notice.create({ title: 'Diwali Celebration', body: 'Join us at 7pm in the clubhouse.', postedBy: admin._id });

  console.log('Seed complete:');
  console.log('Admin -> admin@example.com / password');
  console.log('Resident1 -> resident1@example.com / password');
  console.log('Resident2 -> resident2@example.com / password');
  console.log('Resident3 -> resident3@example.com / password');
  console.log('Guard -> guard@example.com / password');
  console.log('Staff -> staff@example.com / password');

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
