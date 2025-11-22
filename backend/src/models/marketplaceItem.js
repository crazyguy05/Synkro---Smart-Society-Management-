import mongoose from 'mongoose';

const MarketplaceItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['Sell', 'Exchange', 'Donate'], default: 'Exchange' },
  askingItem: { type: String },
  price: { type: Number },
  contact: { type: String, required: true },
  photoUrl: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('MarketplaceItem', MarketplaceItemSchema);
