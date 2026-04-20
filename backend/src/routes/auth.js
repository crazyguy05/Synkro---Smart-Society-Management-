import { Router } from 'express';
import { register, login, me, listUsers, updateLoginTime, updateUser, getDirectory } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth(), me);
router.get('/directory', auth(), getDirectory);
router.get('/users', auth('admin'), listUsers);
router.patch('/users/:id', auth('admin'), updateUser);
router.post('/updateLoginTime', auth(), updateLoginTime);

export default router;
