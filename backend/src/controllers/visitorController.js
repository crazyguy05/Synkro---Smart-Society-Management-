import Visitor from '../models/visitor.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import User from '../models/user.js';

// Load env and configure Cloudinary (hybrid: URL or separate keys)
dotenv.config();
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({}); // reads CLOUDINARY_URL automatically
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const createVisitor = async (req, res) => {
  try {
    const { name, purpose, reason, photoUrl, flatNumber, residentEmail } = req.body;
    // Try to link to resident by email or flat (User.apartment)
    const resident = await User.findOne({
      $or: [
        residentEmail ? { email: residentEmail } : null,
        flatNumber ? { apartment: flatNumber } : null,
      ].filter(Boolean),
      role: 'resident'
    }).select('_id email apartment');

    const data = {
      name,
      reason: reason || purpose || 'Visit',
      purpose: purpose || reason,
      photoUrl,
      flatNumber,
      residentEmail,
      guard: req.user.id,
      status: 'Pending'
    };
    if (resident) {
      data.residentId = resident._id;
      // maintain legacy link if used elsewhere
      data.resident = resident._id;
      if (!data.residentEmail) data.residentEmail = resident.email;
      if (!data.flatNumber) data.flatNumber = resident.apartment;
    }
    const visitor = await Visitor.create(data);
    res.status(201).json({ success: true, visitor });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create visitor' });
  }
};

export const listForResident = async (req, res) => {
  try {
    const list = await Visitor.find({ resident: req.user.id }).sort('-createdAt');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch visitors' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'Allowed' | 'Denied' | 'Pending'
    const allowed = ['Allowed','Denied','Pending'];
    const normalized = allowed.includes(status) ? status : 'Pending';
    const updated = await Visitor.findByIdAndUpdate(id, { status: normalized }, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};

// New: Upload visitor photo to Cloudinary (expects { file: dataURI })
export const uploadVisitorPhoto = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(400).json({ message: 'Cloudinary not configured' });
    }
    if (!req.files || !req.files.photo) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }
    const file = req.files.photo;
    const tempPath = file.tempFilePath || file.tempFileName || undefined;
    const result = await cloudinary.uploader.upload(tempPath, { folder: 'smart-society/visitors' });
    return res.json({ success: true, photoUrl: result.secure_url });
  } catch (e) {
    return res.status(500).json({ message: 'Upload failed', error: e?.message });
  }
};

// New: Role-based listing
export const getVisitors = async (req, res) => {
  try {
    const { email, flat } = req.query;
    if (email || flat) {
      const q = { $or: [] };
      if (email) q.$or.push({ residentEmail: email });
      if (flat) q.$or.push({ flatNumber: flat });
      const visitors = await Visitor.find(q).sort({ createdAt: -1 });
      return res.json(visitors);
    }

    // Fallback role-based listing
    const role = req.user.role;
    let q = {};
    if (role === 'resident') q = { $or: [{ resident: req.user.id }, { residentId: req.user.id }, { residentEmail: req.user.email }] };
    else if (role === 'guard') q = { guard: req.user.id };
    const list = await Visitor.find(q).sort('-createdAt');
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch visitors' });
  }
};

// New: Pending visitors since last login time for a resident
export const newVisitors = async (req, res) => {
  try {
    const { email, flat } = req.query;
    const user = await User.findOne({ email, role: 'resident' });
    if (!user) return res.status(404).json({ message: 'Resident not found' });
    const q = {
      $and: [
        { $or: [{ residentEmail: email }, { flatNumber: flat }] },
        { status: 'Pending' },
        { createdAt: { $gt: user.lastLoginAt || new Date(0) } }
      ]
    };
    const visitors = await Visitor.find(q).sort({ createdAt: -1 });
    return res.json({ count: visitors.length, visitors });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch new visitors' });
  }
};
