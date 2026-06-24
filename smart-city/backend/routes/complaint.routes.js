import express from 'express';
import {
  submitComplaint, getComplaints, getComplaint, updateComplaintStatus,
  assignComplaint, upvoteComplaint, rateComplaint, deleteComplaint,
  getStats, getPublicComplaints,
} from '../controllers/complaint.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { complaintValidation, statusUpdateValidation, validate } from '../middleware/validation.middleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicComplaints);

// Protected routes
router.use(protect);

router.get('/stats', getStats);
router.get('/', getComplaints);
router.post('/', upload.array('images', 5), complaintValidation, validate, submitComplaint);
router.get('/:id', getComplaint);
router.delete('/:id', deleteComplaint);
router.put('/:id/upvote', authorize('citizen'), upvoteComplaint);
router.put('/:id/rate', authorize('citizen'), rateComplaint);
router.put('/:id/status', authorize('admin', 'department_head'), statusUpdateValidation, validate, updateComplaintStatus);
router.put('/:id/assign', authorize('admin'), assignComplaint);

export default router;
