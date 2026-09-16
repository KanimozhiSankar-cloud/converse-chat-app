import { Router } from 'express';
import { forgotPassword, login, register, resetPasswordController } from '../controllers/authController';
import { validateBody } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  validateBody((body) => {
    const { name, username, email, password, confirmPassword } = body as { name?: string; username?: string; email?: string; password?: string; confirmPassword?: string };
    if (!name || name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) return 'Username must be 3-30 letters, numbers, or underscores';
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return 'A valid email is required';
    if (!password || password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  }),
  register
);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordController);

router.post(
  '/login',
  validateBody((body) => {
    const { email, password } = body as { email?: string; password?: string };
    if (!email) return 'Email is required';
    if (!password) return 'Password is required';
    return null;
  }),
  login
);

export default router;
