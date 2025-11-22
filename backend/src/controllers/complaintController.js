import Complaint from '../models/complaint.js';

export const createComplaint = async (req, res) => {
  try {
    const base = { ...req.body, resident: req.user.id };
    // set metadata from user if not provided
    if (!base.residentEmail && req.user?.email) base.residentEmail = req.user.email;
    if (!base.flatNumber && req.user?.apartment) base.flatNumber = req.user.apartment;
    // initialize workflow history with submitted step by resident
    base.history = [{ step: 'submitted', by: req.user.id }];
    base.timeline = [{ stage: 'Submitted', updatedBy: req.user.id }];
    const complaint = await Complaint.create(base);
    res.json(complaint);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create complaint' });
  }
};

export const listMyComplaints = async (req, res) => {
  try {
    const list = await Complaint.find({ resident: req.user.id })
      .populate('assignedTo', 'name role')
      .populate('history.by', 'name role')
      .populate('timeline.updatedBy', 'name role');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
};

export const listAllComplaints = async (req, res) => {
  try {
    const { status, category, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (q) filter.$or = [{ description: new RegExp(q, 'i') }, { category: new RegExp(q, 'i') }, { title: new RegExp(q, 'i') }];
    const list = await Complaint.find(filter)
      .sort('-createdAt')
      .populate('resident', 'name email apartment')
      .populate('assignedTo', 'name role')
      .populate('history.by', 'name role')
      .populate('timeline.updatedBy', 'name role');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
};

export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const updated = await Complaint.findById(id);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    updated.assignedTo = assignedTo;
    // Record assigned step by current admin
    updated.history = updated.history || [];
    updated.history.push({ step: 'assigned', by: req.user.id });
    updated.timeline = updated.timeline || [];
    updated.timeline.push({ stage: 'Assigned', updatedBy: req.user.id });
    await updated.save();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Failed to assign' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, assignedTo } = req.body;
    const allowed = ['pending', 'in_progress', 'resolved', 'Submitted', 'Assigned', 'In Progress', 'Resolved'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const doc = await Complaint.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    // If provided, update assignee too
    if (assignedTo) doc.assignedTo = assignedTo;
    doc.status = status;
    // Map status to step timeline
    const stepMap = { pending: 'submitted', Submitted: 'submitted', Assigned: 'assigned', 'In Progress': 'in_progress', in_progress: 'in_progress', Resolved: 'resolved', resolved: 'resolved' };
    const stageMap = { submitted: 'Submitted', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' };
    const step = stepMap[status];
    doc.history = doc.history || [];
    // avoid duplicating a same-step immediately if it's already the last
    if (!doc.history.length || doc.history[doc.history.length - 1].step !== step) {
      doc.history.push({ step, by: req.user.id, note });
    }
    // push timeline entry
    doc.timeline = doc.timeline || [];
    doc.timeline.push({ stage: stageMap[step], updatedBy: req.user.id, note });
    await doc.save();
    const populated = await Complaint.findById(id)
      .populate('assignedTo', 'name role')
      .populate('history.by', 'name role')
      .populate('timeline.updatedBy', 'name role');
    res.json(populated);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    await Complaint.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete complaint' });
  }
};
