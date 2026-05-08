import mongoose from 'mongoose';

const MotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  votes: {
    yes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    no:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    abstain: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  closed: { type: Boolean, default: false },
}, { timestamps: true });

const MeetingSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  agenda:      { type: String, default: '' },
  location:    { type: String, default: '' },
  scheduledAt: { type: Date,   required: true },
  durationMins:{ type: Number, default: 60 },
  host:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rsvps: {
    going:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maybe:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    declined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  motions: [MotionSchema],
  status: { type: String, enum: ['Scheduled', 'Live', 'Ended', 'Cancelled'], default: 'Scheduled' },
}, { timestamps: true });

export default mongoose.model('Meeting', MeetingSchema);
