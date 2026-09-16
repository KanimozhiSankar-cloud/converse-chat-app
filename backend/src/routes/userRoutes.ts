import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getCurrentUser, getUser, getUsers, updateCurrentPassword, updateCurrentUser } from '../controllers/userController';

const router = Router();

router.use(requireAuth);
router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);
router.put('/me/password', updateCurrentPassword);
router.get('/', getUsers);
router.get('/:id', getUser);

export default router;
