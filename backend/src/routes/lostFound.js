import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createLostFound, getLostFound, updateLostFoundStatus } from '../controllers/lostFoundController.js';

const router = Router();

// Create a new lost/found post (resident)
router.post('/', auth('resident'), createLostFound);

// Get all posts (any authenticated user)
router.get('/', auth(), getLostFound);

// Update status (resident owner or admin)
router.put('/:id', auth(), updateLostFoundStatus);

export default router;
