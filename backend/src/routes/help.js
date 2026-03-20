import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  addServiceProvider,
  closeHelpRequest,
  createHelpRequest,
  getHelpHub,
  updateServiceProvider,
} from '../controllers/helpController.js';

const router = Router();

router.get('/', auth(['admin', 'resident', 'guard', 'staff']), getHelpHub);
router.post('/requests', auth(['admin', 'resident', 'guard', 'staff']), createHelpRequest);
router.patch('/requests/:id/close', auth(['admin', 'resident', 'guard', 'staff']), closeHelpRequest);

router.post('/services', auth('admin'), addServiceProvider);
router.patch('/services/:id', auth('admin'), updateServiceProvider);

export default router;

