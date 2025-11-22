import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { triggerPanic } from '../controllers/emergencyController.js';

const router = Router();
router.post('/', auth(['admin', 'resident', 'guard', 'staff']), triggerPanic);

export default router;
