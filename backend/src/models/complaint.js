import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  category: { type: String, required: true },
  description: { type: String, required: true },
  photoUrl: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved', 'Submitted', 'Assigned', 'In Progress', 'Resolved'], default: 'Submitted' },
  aiSuggestion: { type: String },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  flatNumber: { type: String },
  residentEmail: { type: String },
  history: [{
    step: { type: String, enum: ['submitted', 'assigned', 'in_progress', 'resolved'], required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String }
  }],
  timeline: [{
    stage: { type: String, enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved'] },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('Complaint', ComplaintSchema);
