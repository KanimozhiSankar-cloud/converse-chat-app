import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createGroupConversation, getGroup } from '../controllers/groupController';

const router = Router();

router.use(requireAuth);
router.post('/', createGroupConversation);
router.get('/:id', getGroup);

export default router;
