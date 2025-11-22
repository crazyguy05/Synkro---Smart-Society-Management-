import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createNotice, listNotices } from '../controllers/noticeController.js';

const router = Router();
router.post('/', auth('admin'), createNotice);
router.get('/', auth(['admin', 'resident', 'staff', 'guard']), listNotices);

export default router;
