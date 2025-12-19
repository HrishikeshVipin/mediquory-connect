import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';

const router = Router();

router.get('/', verifyToken, getNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.put('/:notificationId/read', verifyToken, markAsRead);
router.put('/mark-all-read', verifyToken, markAllAsRead);

export default router;
