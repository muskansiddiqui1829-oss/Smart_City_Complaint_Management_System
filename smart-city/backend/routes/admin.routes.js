import express from 'express';
import {
  getUsers, updateUser, deleteUser, getAnalytics,
  sendBulkNotification, getAllComplaints,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/complaints', getAllComplaints);
router.post('/notifications/bulk', sendBulkNotification);

export default router;
