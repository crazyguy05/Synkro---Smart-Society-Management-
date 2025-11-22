import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  reason: { type: String, required: true },
  purpose: { type: String },
  photoUrl: { type: String },
  guard: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Legacy link (now optional)
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  // New optional link to resident
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  flatNumber: { type: String },
  residentEmail: { type: String },
  // Support both legacy lowercase and new capitalized statuses
  status: { type: String, enum: ['pending','approved','rejected','Pending','Allowed','Denied'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Visitor', VisitorSchema);
