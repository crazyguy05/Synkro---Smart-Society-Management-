import mongoose from 'mongoose';

const PollOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
  },
  { _id: false }
);

const PollSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    options: { type: [PollOptionSchema], validate: [(arr) => arr.length >= 2, 'At least 2 options required'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model('Poll', PollSchema);

