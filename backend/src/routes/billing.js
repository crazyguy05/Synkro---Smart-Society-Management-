import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { listMyBills, markPaid, createOrUpdateBill, createBill, listBills, getBill, updateBillStatus } from '../controllers/billingController.js';

const router = Router();
// Resident endpoints
router.get('/me', auth('resident'), listMyBills);
router.patch('/:id/paid', auth('resident'), markPaid);

// Admin endpoints (new)
router.get('/', auth('admin'), listBills);
router.get('/:id', auth('admin'), getBill);
router.put('/:id/status', auth('admin'), updateBillStatus);
router.post('/new', auth('admin'), createBill);

// Legacy admin upsert (kept for compatibility)
router.post('/', auth('admin'), createOrUpdateBill);

export default router;
