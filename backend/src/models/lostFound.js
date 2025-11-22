import mongoose from 'mongoose';

const LostFoundSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Lost', 'Found'], required: true },
  location: { type: String },
  date: { type: Date, default: Date.now },
  photoUrl: { type: String },
  status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LostFound', LostFoundSchema);
