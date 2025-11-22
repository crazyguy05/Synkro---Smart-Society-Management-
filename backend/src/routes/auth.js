import { Router } from 'express';
import { register, login, me, listUsers, updateLoginTime } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth(), me);
router.get('/users', auth('admin'), listUsers);
router.post('/updateLoginTime', auth(), updateLoginTime);

export default router;
