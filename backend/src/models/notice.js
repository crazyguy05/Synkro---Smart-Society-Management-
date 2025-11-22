import mongoose from 'mongoose';

const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Notice', NoticeSchema);
