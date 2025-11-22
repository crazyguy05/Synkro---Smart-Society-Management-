import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { triggerPanic, debugEmergency } from '../controllers/emergencyController.js';

const router = Router();
router.post('/panic', auth(['resident', 'guard', 'admin', 'staff']), triggerPanic);
router.get('/debug', auth(['admin']), debugEmergency);

export default router;
