import express from 'express';
import {
  createOfficer,
  getAllOfficers,
  getOfficer,
  updateOfficer,
  assignComplaintToOfficer,
  getOfficerComplaints,
  updateComplaintFromOfficer,
  getOfficerPerformance,
  deleteOfficer,
  bulkAssignComplaints,
} from '../controllers/officer.controller.js';
import { isAuthenticated, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (none for officers)

// Protected routes (admin, department_head)
router.use(isAuthenticated);

// Create officer (admin only)
router.post('/', authorize('admin'), createOfficer);

// Bulk assign complaints (admin only) - Bot functionality
router.post('/bulk-assign', authorize('admin'), bulkAssignComplaints);

// Get all officers
router.get('/', authorize('admin', 'department_head'), getAllOfficers);

// Get officer performance metrics
router.get('/:id/performance', authorize('admin', 'department_head'), getOfficerPerformance);

// Get officer's assigned complaints
router.get('/:id/complaints', authorize('admin', 'department_head'), getOfficerComplaints);

// Get single officer
router.get('/:id', authorize('admin', 'department_head'), getOfficer);

// Update officer (admin only)
router.put('/:id', authorize('admin'), updateOfficer);

// Assign complaint to officer (admin, department_head)
router.post('/:id/assign-complaint', authorize('admin', 'department_head'), assignComplaintToOfficer);

// Update complaint status (officer action)
router.put('/:id/complaints/:complaintId', authorize('admin', 'department_head'), updateComplaintFromOfficer);

// Delete officer (admin only)
router.delete('/:id', authorize('admin'), deleteOfficer);

export default router;
