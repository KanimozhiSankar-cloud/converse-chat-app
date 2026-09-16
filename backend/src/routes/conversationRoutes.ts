import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createConversation,
  getConversationMessages,
  getConversations,
  searchConversationMessages,
} from '../controllers/conversationController';

const router = Router();

router.use(requireAuth);
router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id/messages/search', searchConversationMessages);
router.get('/:id/messages', getConversationMessages);

export default router;
