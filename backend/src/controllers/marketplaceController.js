import MarketplaceItem from '../models/marketplaceItem.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({});
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
}

export const createMarketplaceItem = async (req, res) => {
  try {
    const { title, description, type, askingItem, price, contact, photoUrl } = req.body;
    let finalPhotoUrl = photoUrl;
    // support multipart file 'photo' or base64 'photo'
    if (!finalPhotoUrl) {
      const file = req.files?.photo;
      const base64 = req.body?.photo;
      if (file?.tempFilePath) {
        const up = await cloudinary.uploader.upload(file.tempFilePath, { folder: 'smart-society/marketplace' });
        finalPhotoUrl = up.secure_url;
      } else if (base64 && (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME)) {
        const up = await cloudinary.uploader.upload(base64, { folder: 'smart-society/marketplace' });
        finalPhotoUrl = up.secure_url;
      }
    }
    const safeType = ['Sell', 'Exchange', 'Donate'].includes(type) ? type : 'Exchange';
    // Enforce: Exchange should not carry price; Sell uses price and ignores askingItem; Donate ignores both
    const askingItemToSave = safeType === 'Exchange' ? askingItem : undefined;
    const priceToSave = safeType === 'Sell' ? (price !== undefined && price !== null && price !== '' ? Number(price) : undefined) : undefined;

    const doc = await MarketplaceItem.create({
      title,
      description,
      type: safeType,
      askingItem: askingItemToSave,
      price: priceToSave,
      contact,
      photoUrl: finalPhotoUrl,
      postedBy: req.user?.id,
      status: 'Active',
    });
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create listing' });
  }
};

export const getAllMarketplaceItems = async (req, res) => {
  try {
    const { type, q, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (q) filter.$or = [ { title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') } ];
    const list = await MarketplaceItem.find(filter).sort('-createdAt').populate('postedBy', 'name email apartment');
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

export const updateMarketplaceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' | 'Closed'
    const doc = await MarketplaceItem.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(doc.postedBy) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    doc.status = status === 'Closed' ? 'Closed' : 'Active';
    await doc.save();
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update listing' });
  }
};

export const deleteMarketplaceItem = async (req, res) => {
  try {
    const { id } = req.params;
    await MarketplaceItem.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to delete listing' });
  }
};
