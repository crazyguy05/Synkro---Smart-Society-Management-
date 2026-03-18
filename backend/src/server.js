import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import os from 'os';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import visitorRoutes from './routes/visitors.js';
import noticeRoutes from './routes/notices.js';
import billingRoutes from './routes/billing.js';
import leaderboardRoutes from './routes/leaderboard.js';
import aiRoutes from './routes/ai.js';
import emergencyRoutes from './routes/emergency.js';
import panicRoutes from './routes/panic.js';
import lostFoundRoutes from './routes/lostFound.js';
import marketplaceRoutes from './routes/marketplace.js';

dotenv.config();

const app = express();
app.set('etag', false);
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
// Increase limits for base64 image uploads to Cloudinary
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Enable multipart file uploads with temp files (cross-platform)
app.use(fileUpload({ useTempFiles: true, tempFileDir: os.tmpdir() }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/', (_, res) => res.send({ status: 'ok', service: 'Smart Society OS API' }));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/marketplace', marketplaceRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('DB connection failed', err);
  process.exit(1);
});
