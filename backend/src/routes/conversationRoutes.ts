import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  clearMessages,
  createConversation,
  getConversationMessages,
  getConversations,
  markConversationRead,
  removeConversation,
  searchConversationMessages,
} from '../controllers/conversationController';

const router = Router();

router.use(requireAuth);
router.get('/', getConversations);
router.post('/', createConversation);
router.put('/:id/read', markConversationRead);
router.delete('/:id/messages', clearMessages);
router.delete('/:id', removeConversation);
router.get('/:id/messages/search', searchConversationMessages);
router.get('/:id/messages', getConversationMessages);

export default router;
