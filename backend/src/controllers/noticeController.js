import Notice from '../models/notice.js';

export const createNotice = async (req, res) => {
  try {
    const notice = await Notice.create({ ...req.body, postedBy: req.user.id });
    res.json(notice);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create notice' });
  }
};

export const listNotices = async (_req, res) => {
  try {
    const list = await Notice.find().sort('-createdAt');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch notices' });
  }
};
