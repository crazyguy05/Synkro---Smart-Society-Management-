import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
  // New generalized fields
  billId: { type: String, unique: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flatNumber: { type: String },
  category: { type: String, enum: ['Maintenance','Water','Electricity','Parking','Misc'], default: 'Maintenance' },
  description: { type: String },
  amount: { type: Number, default: 0 },
  issueDate: { type: Date, default: () => new Date() },
  dueDate: { type: Date },
  status: { type: String, enum: ['Unpaid','Paid','Overdue'], default: 'Unpaid' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Legacy fields kept for compatibility with existing code
  month: { type: String },
  maintenance: { type: Number, default: 0 },
  electricity: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  paid: { type: Boolean, default: false },
  pointsAwarded: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate incremental billId like BILL-0001 if not present
BillSchema.pre('save', async function(next) {
  if (this.billId) return next();
  try {
    const count = await mongoose.model('Bill').countDocuments();
    const seq = (count + 1).toString().padStart(4, '0');
    this.billId = `BILL-${seq}`;
    next();
  } catch (e) {
    next(e);
  }
});

export default mongoose.model('Bill', BillSchema);
