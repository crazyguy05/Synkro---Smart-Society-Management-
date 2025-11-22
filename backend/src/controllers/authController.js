import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const sign = (user) => jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'resident', apartment, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role, apartment, phone });
    const token = sign(user);
    return res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (e) {
    return res.status(500).json({ message: 'Registration failed' });
  }
};

export const updateLoginTime = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { lastLoginAt: new Date() }, { new: true }).select('-password');
    return res.json({ success: true, user });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update login time' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = sign(user);
    return res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (e) {
    return res.status(500).json({ message: 'Login failed' });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Admin-only: list users, optional role filter
export const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const q = role ? { role } : {};
    const users = await User.find(q).select('name email role apartment');
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list users' });
  }
};
