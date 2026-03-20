import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createPoll,
  listPolls,
  requestVoteOtp,
  castVote,
  getPollResults,
  getVoteLogs,
  sendVotingReminders,
} from '../controllers/votingController.js';

const router = Router();

router.post('/', auth('admin'), createPoll);
router.get('/', auth(['admin', 'resident']), listPolls);
router.post('/:id/request-otp', auth(['admin', 'resident']), requestVoteOtp);
router.post('/:id/vote', auth(['admin', 'resident']), castVote);
router.get('/:id/results', auth(['admin', 'resident']), getPollResults);
router.get('/:id/logs', auth('admin'), getVoteLogs);
router.post('/:id/remind', auth('admin'), sendVotingReminders);

export default router;

