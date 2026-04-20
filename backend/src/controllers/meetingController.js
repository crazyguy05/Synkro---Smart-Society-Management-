import Meeting from '../models/meeting.js';

const POPULATE_HOST = { path: 'host', select: 'name email role' };

const enrich = (m, userId) => {
  if (!m) return m;
  const obj = m.toObject ? m.toObject() : m;
  const uid = userId ? String(userId) : null;

  // add RSVP counts + current user's rsvp
  const rsvps = obj.rsvps || { going: [], maybe: [], declined: [] };
  obj.rsvpCounts = {
    going: rsvps.going?.length || 0,
    maybe: rsvps.maybe?.length || 0,
    declined: rsvps.declined?.length || 0,
  };
  obj.myRsvp =
    uid && rsvps.going?.some(x => String(x) === uid)    ? 'going' :
    uid && rsvps.maybe?.some(x => String(x) === uid)    ? 'maybe' :
    uid && rsvps.declined?.some(x => String(x) === uid) ? 'declined' : null;

  // per-motion: vote counts + current user's vote
  obj.motions = (obj.motions || []).map(mo => {
    const v = mo.votes || { yes: [], no: [], abstain: [] };
    const counts = {
      yes: v.yes?.length || 0,
      no: v.no?.length || 0,
      abstain: v.abstain?.length || 0,
    };
    const myVote =
      uid && v.yes?.some(x => String(x) === uid)     ? 'yes' :
      uid && v.no?.some(x => String(x) === uid)      ? 'no' :
      uid && v.abstain?.some(x => String(x) === uid) ? 'abstain' : null;
    return { ...mo, voteCounts: counts, myVote };
  });

  return obj;
};

export const listMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find().populate(POPULATE_HOST).sort({ scheduledAt: -1 });
    res.json(meetings.map(m => enrich(m, req.user?.id)));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch meetings' });
  }
};

export const getMeeting = async (req, res) => {
  try {
    const m = await Meeting.findById(req.params.id).populate(POPULATE_HOST);
    if (!m) return res.status(404).json({ message: 'Not found' });
    res.json(enrich(m, req.user?.id));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch meeting' });
  }
};

export const createMeeting = async (req, res) => {
  try {
    const { title, agenda, location, scheduledAt, durationMins, motions } = req.body;
    if (!title || !scheduledAt) return res.status(400).json({ message: 'title and scheduledAt are required' });
    const m = await Meeting.create({
      title, agenda, location,
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins ? Number(durationMins) : 60,
      host: req.user.id,
      motions: Array.isArray(motions) ? motions.map(t => ({ title: typeof t === 'string' ? t : t.title, description: t?.description || '' })) : [],
    });
    await m.populate(POPULATE_HOST);
    res.status(201).json(enrich(m, req.user.id));
  } catch (e) {
    res.status(500).json({ message: 'Failed to create meeting' });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const allowed = ['title', 'agenda', 'location', 'scheduledAt', 'durationMins', 'status'];
    const patch = {};
    for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
    const m = await Meeting.findByIdAndUpdate(req.params.id, patch, { new: true }).populate(POPULATE_HOST);
    if (!m) return res.status(404).json({ message: 'Not found' });
    res.json(enrich(m, req.user?.id));
  } catch (e) {
    res.status(500).json({ message: 'Failed to update meeting' });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const r = await Meeting.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete meeting' });
  }
};

export const setRsvp = async (req, res) => {
  try {
    const { rsvp } = req.body; // 'going' | 'maybe' | 'declined'
    if (!['going', 'maybe', 'declined'].includes(rsvp)) {
      return res.status(400).json({ message: 'Invalid rsvp' });
    }
    const m = await Meeting.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Not found' });
    ['going', 'maybe', 'declined'].forEach(bucket => {
      m.rsvps[bucket] = (m.rsvps[bucket] || []).filter(x => String(x) !== String(req.user.id));
    });
    m.rsvps[rsvp].push(req.user.id);
    await m.save();
    await m.populate(POPULATE_HOST);
    res.json(enrich(m, req.user.id));
  } catch (e) {
    res.status(500).json({ message: 'Failed to set RSVP' });
  }
};

export const addMotion = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Motion title required' });
    const m = await Meeting.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Not found' });
    m.motions.push({ title, description: description || '' });
    await m.save();
    await m.populate(POPULATE_HOST);
    res.status(201).json(enrich(m, req.user.id));
  } catch (e) {
    res.status(500).json({ message: 'Failed to add motion' });
  }
};

export const voteMotion = async (req, res) => {
  try {
    const { vote } = req.body; // 'yes' | 'no' | 'abstain'
    if (!['yes', 'no', 'abstain'].includes(vote)) {
      return res.status(400).json({ message: 'Invalid vote' });
    }
    const m = await Meeting.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Not found' });
    const motion = m.motions.id(req.params.motionId);
    if (!motion) return res.status(404).json({ message: 'Motion not found' });
    if (motion.closed) return res.status(400).json({ message: 'Motion closed' });

    ['yes', 'no', 'abstain'].forEach(bucket => {
      motion.votes[bucket] = (motion.votes[bucket] || []).filter(x => String(x) !== String(req.user.id));
    });
    motion.votes[vote].push(req.user.id);
    await m.save();
    await m.populate(POPULATE_HOST);
    res.json(enrich(m, req.user.id));
  } catch (e) {
    res.status(500).json({ message: 'Failed to cast vote' });
  }
};

export const closeMotion = async (req, res) => {
  try {
    const m = await Meeting.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Not found' });
    const motion = m.motions.id(req.params.motionId);
    if (!motion) return res.status(404).json({ message: 'Motion not found' });
    motion.closed = true;
    await m.save();
    await m.populate(POPULATE_HOST);
    res.json(enrich(m, req.user.id));
  } catch (e) {
    res.status(500).json({ message: 'Failed to close motion' });
  }
};
