import mongoose from 'mongoose';

const ServiceProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    serviceType: { type: String, enum: ['Plumber', 'Electrician', 'Maid', 'Carpenter', 'Technician', 'Other'], default: 'Other' },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    verified: { type: Boolean, default: true },
    availability: { type: String, enum: ['online', 'offline'], default: 'online' },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('ServiceProvider', ServiceProviderSchema);

