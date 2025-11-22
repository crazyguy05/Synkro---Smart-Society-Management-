import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createComplaint, listMyComplaints, assignComplaint, updateStatus, listAllComplaints, deleteComplaint } from '../controllers/complaintController.js';

const router = Router();
router.post('/', auth('resident'), createComplaint);
router.get('/me', auth('resident'), listMyComplaints);
router.get('/my', auth('resident'), listMyComplaints);
router.get('/', auth(['admin']), listAllComplaints);
router.patch('/:id/assign', auth(['admin']), assignComplaint);
router.patch('/:id/status', auth(['admin', 'staff']), updateStatus);
router.put('/:id/status', auth(['admin', 'staff']), updateStatus);
router.delete('/:id', auth(['admin']), deleteComplaint);

export default router;
