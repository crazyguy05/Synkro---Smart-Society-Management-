import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createVisitor, listForResident, updateStatus, uploadVisitorPhoto, getVisitors, newVisitors } from '../controllers/visitorController.js';

const router = Router();
// New routes
router.post('/upload', auth('guard'), uploadVisitorPhoto);
router.get('/', auth(), getVisitors);
router.get('/new', auth('resident'), newVisitors);

// Legacy routes (kept)
router.post('/', auth('guard'), createVisitor);
router.get('/my', auth('resident'), listForResident);
router.patch('/:id/status', auth('resident'), updateStatus);
router.put('/:id/status', auth('resident'), updateStatus);

export default router;
