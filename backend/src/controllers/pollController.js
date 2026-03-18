import Poll from '../models/poll.js';

export const createPoll = async (req, res) => {
  try {
    const { question, options, endsAt } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2)
      return res.status(400).json({ message: 'Question and at least 2 options required' });
    const poll = await Poll.create({
      question,
      options: options.map(text => ({ text })),
      endsAt,
      createdBy: req.user.id
    });
    res.json(poll);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create poll' });
  }
};

export const listPolls = async (req, res) => {
  try {
    const polls = await Poll.find().sort('-createdAt');
    const userId = req.user.id;
    const result = polls.map(p => {
      const plain = p.toObject();
      plain.myVote = null;
      for (const opt of plain.options) {
        if (opt.voters.some(v => v.toString() === userId)) {
          plain.myVote = opt._id.toString();
          break;
        }
      }
      return plain;
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch polls' });
  }
};

export const vote = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll || !poll.active) return res.status(404).json({ message: 'Poll not found or closed' });
    if (poll.endsAt && new Date() > poll.endsAt)
      return res.status(400).json({ message: 'Poll has ended' });

    const userId = req.user.id;
    poll.options.forEach(opt => {
      opt.voters = opt.voters.filter(v => v.toString() !== userId);
    });

    const option = poll.options.id(req.body.optionId);
    if (!option) return res.status(400).json({ message: 'Invalid option' });
    option.voters.push(userId);
    await poll.save();
    const plain = poll.toObject();
    plain.myVote = option._id.toString();
    res.json(plain);
  } catch (e) {
    res.status(500).json({ message: 'Failed to vote' });
  }
};

export const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    res.json(poll);
  } catch (e) {
    res.status(500).json({ message: 'Failed to close poll' });
  }
};

export const deletePoll = async (req, res) => {
  try {
    await Poll.findByIdAndDelete(req.params.id);
    res.json({ message: 'Poll deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete poll' });
  }
};
