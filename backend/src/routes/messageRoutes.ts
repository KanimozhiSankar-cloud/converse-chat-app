import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { postMessage, readMessage, removeMessage, updateMessage } from '../controllers/messageController';

const router = Router();

router.use(requireAuth);
router.post('/', postMessage);
router.put('/:id/read', readMessage);
router.put('/:id', updateMessage);
router.delete('/:id', removeMessage);

export default router;
