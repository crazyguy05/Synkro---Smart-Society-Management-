import mongoose from 'mongoose';

const HelpRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    apartment: { type: String },
    title: { type: String, required: true },
    details: { type: String },
    contactPhone: { type: String },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model('HelpRequest', HelpRequestSchema);

