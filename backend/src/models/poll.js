import mongoose from 'mongoose';

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endsAt: { type: Date },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Poll', PollSchema);
