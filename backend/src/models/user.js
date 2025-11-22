import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'resident', 'guard', 'staff'], default: 'resident' },
  apartment: { type: String },
  password: { type: String, required: true, select: false },
  lastLoginAt: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(pw) {
  return bcrypt.compare(pw, this.password);
};

export default mongoose.model('User', UserSchema);
