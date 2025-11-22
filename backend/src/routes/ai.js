import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { suggestForComplaint } from '../controllers/aiController.js';

const router = Router();
router.post('/suggest', auth(['admin']), suggestForComplaint);

export default router;
