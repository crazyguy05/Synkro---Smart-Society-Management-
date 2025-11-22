import mongoose from 'mongoose';

const RewardSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  badges: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Reward', RewardSchema);
