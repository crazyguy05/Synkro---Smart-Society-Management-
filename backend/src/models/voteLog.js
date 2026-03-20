import mongoose from 'mongoose';

const VoteLogSchema = new mongoose.Schema(
  {
    poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
    voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    apartment: { type: String, required: true },
    optionIndex: { type: Number, required: true },
    anonymous: { type: Boolean, default: false },
    prevHash: { type: String, default: '' },
    hash: { type: String, required: true },
  },
  { timestamps: true }
);

VoteLogSchema.index({ poll: 1, apartment: 1 }, { unique: true });

export default mongoose.model('VoteLog', VoteLogSchema);

