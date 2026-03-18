import Bill from '../models/bill.js';
import User from '../models/user.js';

// Stored maintenance rate (in-memory for simplicity, persisted via a simple config approach)
let _maintenanceRate = 2; // default ₹2 per sq ft

export const getMaintenanceRate = (_req, res) => {
  res.json({ ratePerSqFt: _maintenanceRate });
};

export const bulkGenerateMaintenance = async (req, res) => {
  try {
    const { ratePerSqFt, dueDate, month } = req.body;
    if (!ratePerSqFt || ratePerSqFt <= 0) return res.status(400).json({ message: 'Invalid rate' });
    _maintenanceRate = ratePerSqFt;

    const residents = await User.find({ role: 'resident' });
    const bills = [];
    for (const r of residents) {
      const area = r.areaSqFt || 0;
      if (area <= 0) continue;
      const amount = parseFloat((area * ratePerSqFt).toFixed(2));
      const bill = new Bill({
        resident: r._id,
        flatNumber: r.apartment,
        category: 'Maintenance',
        description: `Maintenance for ${month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} — ${area} sq ft × ₹${ratePerSqFt}/sq ft`,
        amount,
        month: month || new Date().toISOString().slice(0, 7),
        issueDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: 'Unpaid',
        generatedBy: req.user.id
      });
      await bill.save();
      bills.push(bill);
    }
    res.json({ generated: bills.length, bills });
  } catch (e) {
    res.status(500).json({ message: 'Failed to generate maintenance bills' });
  }
};

export const previewMaintenance = async (req, res) => {
  try {
    const { ratePerSqFt } = req.query;
    const rate = parseFloat(ratePerSqFt) || _maintenanceRate;
    const residents = await User.find({ role: 'resident' }).select('name apartment areaSqFt email');
    const preview = residents.map(r => ({
      _id: r._id,
      name: r.name,
      apartment: r.apartment,
      areaSqFt: r.areaSqFt || 0,
      amount: parseFloat(((r.areaSqFt || 0) * rate).toFixed(2))
    }));
    res.json({ ratePerSqFt: rate, preview });
  } catch (e) {
    res.status(500).json({ message: 'Failed to preview' });
  }
};

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
