import LostFound from '../models/lostFound.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({});
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
}

export const createLostFound = async (req, res) => {
  try {
    const { itemName, description, category, location, date, photoUrl } = req.body;
    let finalPhotoUrl = photoUrl;
    // Optional: support multipart or base64 body field 'photo'
    if (!finalPhotoUrl) {
      const file = req.files?.photo;
      const base64 = req.body?.photo;
      if (file?.tempFilePath) {
        const up = await cloudinary.uploader.upload(file.tempFilePath, { folder: 'smart-society/lostfound' });
        finalPhotoUrl = up.secure_url;
      } else if (base64 && (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME)) {
        const up = await cloudinary.uploader.upload(base64, { folder: 'smart-society/lostfound' });
        finalPhotoUrl = up.secure_url;
      }
    }
    // Require photo when category is 'Found'; allow optional for 'Lost'
    if (category === 'Found' && !finalPhotoUrl) {
      return res.status(400).json({ message: 'Photo is required for Found items' });
    }
    const doc = await LostFound.create({
      itemName,
      description,
      category,
      location,
      date: date ? new Date(date) : undefined,
      photoUrl: finalPhotoUrl,
      postedBy: req.user?.id,
      status: 'Active'
    });
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create entry' });
  }
};

export const getLostFound = async (req, res) => {
  try {
    const { category, status, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) filter.$or = [ { itemName: new RegExp(q, 'i') }, { location: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') } ];
    const list = await LostFound.find(filter).sort('-createdAt').populate('postedBy', 'name email apartment role');
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch entries' });
  }
};

export const updateLostFoundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' | 'Resolved'
    const entry = await LostFound.findById(id);
    if (!entry) return res.status(404).json({ message: 'Not found' });
    // allow admin or owner
    const isOwner = String(entry.postedBy) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    entry.status = status === 'Resolved' ? 'Resolved' : 'Active';
    await entry.save();
    return res.json(entry);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update entry' });
  }
};

