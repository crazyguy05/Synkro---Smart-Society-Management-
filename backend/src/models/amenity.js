import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  purpose: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String }
}, { timestamps: true });

const AmenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  capacity: { type: Number, default: 1 },
  available: { type: Boolean, default: true },
  bookings: [BookingSchema]
}, { timestamps: true });

export default mongoose.model('Amenity', AmenitySchema);
