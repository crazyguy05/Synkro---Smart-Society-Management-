import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = Router();
router.get('/', auth(['admin', 'resident']), getLeaderboard);

export default router;
