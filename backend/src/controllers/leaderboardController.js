import Reward from '../models/reward.js';

export const getLeaderboard = async (_req, res) => {
  try {
    const list = await Reward.find().populate('resident', 'name apartment').sort({ points: -1 }).limit(50);
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};
