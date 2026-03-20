import crypto from 'crypto';
import Poll from '../models/poll.js';
import VoteLog from '../models/voteLog.js';
import User from '../models/user.js';

const otpStore = new Map();

const isPollOpen = (poll) => poll.status === 'open' && new Date(poll.deadline) > new Date();

const computeHash = ({ pollId, voterId, apartment, optionIndex, prevHash, createdAt }) =>
  crypto
    .createHash('sha256')
    .update(`${pollId}|${voterId}|${apartment}|${optionIndex}|${prevHash}|${createdAt}`)
    .digest('hex');

export const createPoll = async (req, res) => {
  try {
    const { title, description, options, deadline, isAnonymous = false } = req.body;
    if (!title || !Array.isArray(options) || options.length < 2 || !deadline) {
      return res.status(400).json({ message: 'title, options(>=2), deadline are required' });
    }
    const cleanedOptions = options.map((o) => ({ text: String(o).trim() })).filter((o) => o.text);
    if (cleanedOptions.length < 2) return res.status(400).json({ message: 'Need at least 2 valid options' });

    const poll = await Poll.create({
      title,
      description,
      options: cleanedOptions,
      deadline: new Date(deadline),
      isAnonymous: Boolean(isAnonymous),
      createdBy: req.user.id,
      status: 'open',
    });
    return res.json(poll);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create poll' });
  }
};

export const listPolls = async (_req, res) => {
  try {
    const polls = await Poll.find().sort('-createdAt');
    const withDynamicStatus = polls.map((p) => ({
      ...p.toObject(),
      status: isPollOpen(p) ? 'open' : 'closed',
    }));
    return res.json(withDynamicStatus);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch polls' });
  }
};

export const requestVoteOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (!isPollOpen(poll)) return res.status(400).json({ message: 'Poll is closed' });

    // Demo OTP (no SMS integration yet). Override via env if needed.
    const code = String(process.env.VOTING_DEMO_OTP || '123456');
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(`${id}:${req.user.id}`, { code, expiresAt });

    // Demo behavior: return OTP in API response. Replace with SMS/WhatsApp channel in production.
    return res.json({ success: true, otp: code, expiresAt, message: 'OTP generated for secure vote' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to generate OTP' });
  }
};

export const castVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex, flatNumber, otp } = req.body;
    const poll = await Poll.findById(id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (!isPollOpen(poll)) return res.status(400).json({ message: 'Poll is closed' });
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }

    const apartment = String(flatNumber || req.user.apartment || '').trim();
    if (!apartment) return res.status(400).json({ message: 'Flat number is required' });
    if (req.user.role === 'resident' && req.user.apartment && apartment !== req.user.apartment) {
      return res.status(403).json({ message: 'Flat number mismatch' });
    }

    const otpKey = `${id}:${req.user.id}`;
    const otpInfo = otpStore.get(otpKey);
    if (!otpInfo || otpInfo.expiresAt < Date.now() || String(otp) !== String(otpInfo.code)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const exists = await VoteLog.findOne({ poll: id, apartment });
    if (exists) return res.status(400).json({ message: 'This household has already voted' });

    const lastLog = await VoteLog.findOne({ poll: id }).sort('-createdAt');
    const prevHash = lastLog?.hash || '';
    const createdAt = new Date().toISOString();
    const hash = computeHash({
      pollId: id,
      voterId: req.user.id,
      apartment,
      optionIndex,
      prevHash,
      createdAt,
    });

    await VoteLog.create({
      poll: id,
      voter: req.user.id,
      apartment,
      optionIndex,
      anonymous: poll.isAnonymous,
      prevHash,
      hash,
      createdAt: new Date(createdAt),
    });

    poll.options[optionIndex].votes += 1;
    await poll.save();
    otpStore.delete(otpKey);

    return res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (e) {
    if (e?.code === 11000) return res.status(400).json({ message: 'This household has already voted' });
    return res.status(500).json({ message: 'Failed to cast vote' });
  }
};

export const getPollResults = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    const residents = await User.countDocuments({ role: 'resident' });
    const voteLogs = await VoteLog.find({ poll: id });
    const householdsParticipated = new Set(voteLogs.map((v) => v.apartment)).size;
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

    const options = poll.options.map((o) => ({
      text: o.text,
      votes: o.votes,
      pct: totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0,
    }));

    return res.json({
      pollId: poll._id,
      title: poll.title,
      status: isPollOpen(poll) ? 'open' : 'closed',
      deadline: poll.deadline,
      isAnonymous: poll.isAnonymous,
      totalVotes,
      householdsParticipated,
      participationPct: residents ? Math.round((householdsParticipated / residents) * 100) : 0,
      options,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch poll results' });
  }
};

export const getVoteLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await VoteLog.find({ poll: id }).sort('createdAt').populate('voter', 'name apartment');
    let prev = '';
    const rows = logs.map((l) => {
      const expected = computeHash({
        pollId: String(l.poll),
        voterId: String(l.voter?._id || l.voter),
        apartment: l.apartment,
        optionIndex: l.optionIndex,
        prevHash: l.prevHash,
        createdAt: new Date(l.createdAt).toISOString(),
      });
      const valid = l.prevHash === prev && l.hash === expected;
      prev = l.hash;
      return {
        id: l._id,
        voter: l.anonymous ? 'Anonymous' : l.voter?.name || 'Unknown',
        apartment: l.anonymous ? 'Hidden' : l.apartment,
        optionIndex: l.optionIndex,
        createdAt: l.createdAt,
        prevHash: l.prevHash,
        hash: l.hash,
        valid,
      };
    });
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch vote logs' });
  }
};

export const sendVotingReminders = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    const votedApartments = new Set((await VoteLog.find({ poll: id }).select('apartment')).map((x) => x.apartment));
    const residents = await User.find({ role: 'resident' }).select('name apartment');
    const pending = residents.filter((r) => !votedApartments.has(r.apartment));

    // Placeholder: integrate with SMS/WhatsApp/email provider.
    return res.json({
      success: true,
      message: 'Reminder job prepared (integration placeholder)',
      pendingHouseholds: pending.length,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to prepare reminders' });
  }
};

