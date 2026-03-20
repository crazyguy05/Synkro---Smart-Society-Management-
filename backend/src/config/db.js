import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  // On some Windows/network setups, SRV lookups for mongodb+srv can be refused by the
  // default resolver. Use public resolvers explicitly to avoid ECONNREFUSED on querySrv.
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {
      // Non-fatal; continue with system resolvers if setting fails
    }
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: 'smart-society-os',
    serverSelectionTimeoutMS: 15000
  });
  console.log('MongoDB connected');
};
