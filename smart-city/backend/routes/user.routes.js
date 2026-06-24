import express from 'express';
import {
  getNotifications, markNotificationsRead, deleteNotification,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);
router.delete('/notifications/:id', deleteNotification);

export default router;
