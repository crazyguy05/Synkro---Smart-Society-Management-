import ServiceProvider from '../models/serviceProvider.js';
import HelpRequest from '../models/helpRequest.js';
import User from '../models/user.js';

const emergencyContacts = [
  { name: 'Society Security', phone: '+919876543210', whatsapp: '+919876543210' },
  { name: 'Ambulance', phone: '108', whatsapp: '' },
  { name: 'Fire Brigade', phone: '101', whatsapp: '' },
];

const ensureSeedProviders = async () => {
  const count = await ServiceProvider.countDocuments();
  if (count > 0) return;
  await ServiceProvider.insertMany([
    { name: 'Ramesh Plumbing Services', serviceType: 'Plumber', phone: '+919820000111', whatsapp: '+919820000111', verified: true, availability: 'online' },
    { name: 'Bright Spark Electric Works', serviceType: 'Electrician', phone: '+919810000222', whatsapp: '+919810000222', verified: true, availability: 'offline' },
    { name: 'Seema Home Help', serviceType: 'Maid', phone: '+919830000333', whatsapp: '+919830000333', verified: true, availability: 'online' },
  ]);
};

export const getHelpHub = async (_req, res) => {
  try {
    await ensureSeedProviders();
    const [services, requests] = await Promise.all([
      ServiceProvider.find().sort({ verified: -1, availability: -1, createdAt: -1 }),
      HelpRequest.find({ status: 'open' })
        .populate('requester', 'name apartment')
        .sort({ createdAt: -1 })
        .limit(50),
    ]);

    return res.json({
      emergencyContacts,
      services,
      neighborHelp: requests,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch help hub' });
  }
};

export const createHelpRequest = async (req, res) => {
  try {
    const { title, details, contactPhone } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });
    const user = await User.findById(req.user.id).select('apartment');
    const row = await HelpRequest.create({
      requester: req.user.id,
      apartment: user?.apartment || '',
      title: String(title).trim(),
      details: details || '',
      contactPhone: contactPhone || '',
      status: 'open',
    });
    const populated = await HelpRequest.findById(row._id).populate('requester', 'name apartment');
    return res.json(populated);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create help request' });
  }
};

export const closeHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await HelpRequest.findById(id);
    if (!row) return res.status(404).json({ message: 'Help request not found' });
    if (req.user.role !== 'admin' && String(row.requester) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    row.status = 'closed';
    await row.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to close help request' });
  }
};

export const addServiceProvider = async (req, res) => {
  try {
    const { name, serviceType, phone, whatsapp, verified = true, availability = 'online', notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'name and phone are required' });
    const row = await ServiceProvider.create({ name, serviceType, phone, whatsapp, verified, availability, notes });
    return res.json(row);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to add service provider' });
  }
};

export const updateServiceProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability, verified, notes, whatsapp, phone } = req.body;
    const row = await ServiceProvider.findByIdAndUpdate(
      id,
      { ...(availability ? { availability } : {}), ...(verified !== undefined ? { verified } : {}), ...(notes !== undefined ? { notes } : {}), ...(whatsapp !== undefined ? { whatsapp } : {}), ...(phone !== undefined ? { phone } : {}) },
      { new: true }
    );
    if (!row) return res.status(404).json({ message: 'Service provider not found' });
    return res.json(row);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update service provider' });
  }
};

