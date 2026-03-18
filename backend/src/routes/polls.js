import { Router } from 'express';
import { createPoll, listPolls, vote, closePoll, deletePoll } from '../controllers/pollController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth(), listPolls);
router.post('/', auth('admin'), createPoll);
router.post('/:id/vote', auth(), vote);
router.patch('/:id/close', auth('admin'), closePoll);
router.delete('/:id', auth('admin'), deletePoll);

export default router;
