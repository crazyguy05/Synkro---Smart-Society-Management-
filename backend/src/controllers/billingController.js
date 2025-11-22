import Bill from '../models/bill.js';
import User from '../models/user.js';

export const listMyBills = async (req, res) => {
  try {
    let bills = await Bill.find({ resident: req.user.id }).sort('-createdAt');
    // Auto-mark overdue for unpaid bills past dueDate
    const toOverdue = bills.filter(b => b.status === 'Unpaid' && b.dueDate && new Date(b.dueDate) < new Date());
    await Promise.all(toOverdue.map(b => Bill.findByIdAndUpdate(b._id, { status: 'Overdue' }, { new: true })));
    bills = await Bill.find({ resident: req.user.id }).sort('-createdAt');
    res.json(bills);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch bills' });
  }
};

export const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findByIdAndUpdate(id, { paid: true, status: 'Paid', updatedAt: new Date() }, { new: true });
    res.json(bill);
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark paid' });
  }
};

export const createOrUpdateBill = async (req, res) => {
  try {
    const { resident, month, maintenance = 0, electricity = 0, water = 0 } = req.body;
    const bill = await Bill.findOneAndUpdate(
      { resident, month },
      { maintenance, electricity, water },
      { upsert: true, new: true }
    );
    res.json(bill);
  } catch (e) {
    res.status(500).json({ message: 'Failed to upsert bill' });
  }
};

// New: Admin create a generalized bill
export const createBill = async (req, res) => {
  try {
    const { residentId, residentEmail, flatNumber, category, description, amount, issueDate, dueDate } = req.body;
    let resident = null;
    if (residentId) resident = await User.findById(residentId).select('name apartment email');
    else if (residentEmail) resident = await User.findOne({ email: residentEmail }).select('name apartment email');
    if (!resident) return res.status(400).json({ message: 'Resident not found' });
    const bill = new Bill({
      resident: resident._id,
      flatNumber: flatNumber || resident.apartment,
      category,
      description,
      amount,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'Unpaid',
      generatedBy: req.user.id
    });
    await bill.save();
    return res.json(bill);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create bill' });
  }
};

// New: Admin list all bills with filter/sort and auto-overdue update
export const listBills = async (req, res) => {
  try {
    const { status, sort = 'dueDate' } = req.query;
    const q = {};
    if (status) q.status = status;
    // Auto-overdue pass
    await Bill.updateMany({ status: 'Unpaid', dueDate: { $lt: new Date() } }, { $set: { status: 'Overdue' } });
    const bills = await Bill.find(q).populate('resident', 'name email').sort(sort === 'resident' ? { resident: 1 } : { dueDate: 1 });
    res.json(bills);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch bills' });
  }
};

// New: Get single bill
export const getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('resident', 'name email').populate('generatedBy', 'name email');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    // Update status to Overdue on fetch if needed
    if (bill.status === 'Unpaid' && bill.dueDate && bill.dueDate < new Date()) {
      bill.status = 'Overdue';
      await bill.save();
    }
    res.json(bill);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch bill' });
  }
};

// New: Admin update status
export const updateBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Paid' | 'Overdue' | 'Unpaid'
    if (!['Paid','Overdue','Unpaid'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const update = { status, updatedAt: new Date() };
    if (status === 'Paid') update.paid = true; else if (status !== 'Paid') update.paid = false;
    const bill = await Bill.findByIdAndUpdate(id, update, { new: true });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update bill status' });
  }
};
