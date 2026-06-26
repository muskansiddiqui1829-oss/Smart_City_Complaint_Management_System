import Officer from '../models/Officer.model.js';
import Complaint from '../models/Complaint.model.js';
import ComplaintTransfer from '../models/ComplaintTransfer.model.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/email.js';

// @desc    Create a new officer
// @route   POST /api/officers
// @access  Private (admin only)
export const createOfficer = asyncHandler(async (req, res, next) => {
  const { name, email, phone, designation, department, station, jurisdiction, bio } = req.body;

  // Check if officer with this email already exists
  const existingOfficer = await Officer.findOne({ email });
  if (existingOfficer) {
    return next(new AppError('Officer with this email already exists', 400));
  }

  const officer = await Officer.create({
    name,
    email,
    phone,
    designation,
    department,
    station,
    jurisdiction: typeof jurisdiction === 'string' ? JSON.parse(jurisdiction) : jurisdiction,
    bio,
  });

  // Send welcome email to officer
  try {
    await sendEmail({
      email: officer.email,
      subject: 'Welcome to Smart City Complaint Management Platform',
      message: `Hello ${officer.name},\n\nYou have been registered as a ${officer.designation} in the ${officer.department} department.\n\nYour Designation: ${officer.designation}\nDepartment: ${officer.department}\nStation: ${officer.station}\n\nPlease log in to the platform to start resolving complaints assigned to you.\n\nBest regards,\nSmart City Team`,
    });
  } catch (err) {
    console.error('Error sending email:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Officer created successfully',
    data: officer,
  });
});

// @desc    Get all officers (with filters)
// @route   GET /api/officers
// @access  Private (admin, department_head)
export const getAllOfficers = asyncHandler(async (req, res, next) => {
  const { department, designation, isActive, isAvailable, ward } = req.query;

  let filter = {};

  if (department) filter.department = department;
  if (designation) filter.designation = designation;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

  // Filter by ward jurisdiction
  if (ward) {
    filter['jurisdiction.wards'] = ward;
  }

  const officers = await Officer.find(filter)
    .select('-__v')
    .sort({ department: 1, assignedCount: -1 });

  res.status(200).json({
    success: true,
    count: officers.length,
    data: officers,
  });
});

// @desc    Get single officer
// @route   GET /api/officers/:id
// @access  Private
export const getOfficer = asyncHandler(async (req, res, next) => {
  const officer = await Officer.findById(req.params.id)
    .populate('assignedComplaints', 'complaintId title status priority category');

  if (!officer) {
    return next(new AppError('Officer not found', 404));
  }

  res.status(200).json({
    success: true,
    data: officer,
  });
});

// @desc    Update officer
// @route   PUT /api/officers/:id
// @access  Private (admin only)
export const updateOfficer = asyncHandler(async (req, res, next) => {
  const { name, phone, designation, station, jurisdiction, isAvailable, isActive, bio } = req.body;

  const officer = await Officer.findById(req.params.id);
  if (!officer) {
    return next(new AppError('Officer not found', 404));
  }

  // Update fields
  if (name) officer.name = name;
  if (phone) officer.phone = phone;
  if (designation) officer.designation = designation;
  if (station) officer.station = station;
  if (jurisdiction) officer.jurisdiction = typeof jurisdiction === 'string' ? JSON.parse(jurisdiction) : jurisdiction;
  if (isAvailable !== undefined) officer.isAvailable = isAvailable;
  if (isActive !== undefined) officer.isActive = isActive;
  if (bio) officer.bio = bio;

  await officer.save();

  res.status(200).json({
    success: true,
    message: 'Officer updated successfully',
    data: officer,
  });
});

// @desc    Assign complaint to officer
// @route   POST /api/officers/:id/assign-complaint
// @access  Private (admin, department_head)
export const assignComplaintToOfficer = asyncHandler(async (req, res, next) => {
  const { complaintId, notes } = req.body;

  const officer = await Officer.findById(req.params.id);
  if (!officer) {
    return next(new AppError('Officer not found', 404));
  }

  const complaint = await Complaint.findById(complaintId).populate('citizen', 'name email');
  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  // Check if complaint is already assigned to this officer
  if (complaint.assignedOfficer && complaint.assignedOfficer.toString() === req.params.id) {
    return next(new AppError('Complaint is already assigned to this officer', 400));
  }

  // Create transfer record
  const transfer = await ComplaintTransfer.create({
    complaint: complaintId,
    fromDepartment: complaint.department,
    toDepartment: officer.department,
    toOfficer: officer._id,
    transferredBy: req.user.id,
    transferReason: 'manual_assignment',
    notes,
  });

  // Update complaint
  complaint.assignedOfficer = officer._id;
  complaint.officerAssignedAt = new Date();
  complaint.transfers.push(transfer._id);
  complaint.status = 'under_review';

  // Add status history
  complaint.statusHistory.push({
    status: 'under_review',
    comment: `Assigned to ${officer.designation} ${officer.name}`,
    updatedBy: req.user.id,
  });

  await complaint.save();

  // Update officer's assigned complaints
  officer.assignedComplaints.push(complaint._id);
  officer.assignedCount = officer.assignedComplaints.length;
  await officer.save();

  // Send notification emails
  try {
    await sendEmail({
      email: officer.email,
      subject: `New Complaint Assigned: ${complaint.complaintId}`,
      message: `Hello ${officer.name},\n\nA new complaint has been assigned to you.\n\nComplaint ID: ${complaint.complaintId}\nTitle: ${complaint.title}\nCategory: ${complaint.category}\nPriority: ${complaint.priority}\nLocation: ${complaint.location.address}\n\nPlease review and take action as soon as possible.\n\nBest regards,\nSmart City Team`,
    });

    // Notify citizen
    if (complaint.citizen && complaint.citizen.email) {
      await sendEmail({
        email: complaint.citizen.email,
        subject: `Your Complaint Assigned to Officer: ${complaint.complaintId}`,
        message: `Hello ${complaint.citizen.name},\n\nYour complaint has been assigned to ${officer.designation} ${officer.name} for resolution.\n\nComplaint ID: ${complaint.complaintId}\nTitle: ${complaint.title}\nOfficer: ${officer.name}\nContact: ${officer.email}\n\nYou will be notified of any updates.\n\nBest regards,\nSmart City Team`,
      });
    }
  } catch (err) {
    console.error('Error sending email:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Complaint assigned to officer successfully',
    data: { complaint, transfer, officer },
  });
});

// @desc    Get officer's assigned complaints
// @route   GET /api/officers/:id/complaints
// @access  Private
export const getOfficerComplaints = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  const officer = await Officer.findById(req.params.id);
  if (!officer) {
    return next(new AppError('Officer not found', 404));
  }

  let filter = { assignedOfficer: req.params.id };
  if (status) filter.status = status;

  const complaints = await Complaint.find(filter)
    .select('complaintId title status priority category location.address createdAt')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: complaints.length,
    data: complaints,
  });
});

// @desc    Update complaint status (officer action)
// @route   PUT /api/officers/:id/complaints/:complaintId
// @access  Private (officer)
export const updateComplaintFromOfficer = asyncHandler(async (req, res, next) => {
  const { status, notes, resolutionDetails } = req.body;

  const officer = await Officer.findById(req.params.id);
  if (!officer) {
    return next(new AppError('Officer not found', 404));
  }

  const complaint = await Complaint.findById(req.params.complaintId).populate('citizen', 'name email');
  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  // Verify complaint is assigned to this officer
  if (!complaint.assignedOfficer || complaint.assignedOfficer.toString() !== req.params.id) {
    return next(new AppError('This complaint is not assigned to you', 403));
  }

  const oldStatus = complaint.status;

  // Update complaint
  if (status) complaint.status = status;
  if (resolutionDetails) complaint.resolutionDetails = resolutionDetails;

  // Add status history
  complaint.statusHistory.push({
    status: status || complaint.status,
    comment: notes || `Status updated by ${officer.name}`,
    updatedBy: req.user.id || officer._id,
  });

  if (status === 'resolved') {
    complaint.resolvedAt = new Date();
    officer.resolvedCount += 1;
  }

  await complaint.save();
  await officer.save();

  // Send notification to citizen
  try {
    if (complaint.citizen && complaint.citizen.email) {
      await sendEmail({
        email: complaint.citizen.email,
        subject: `Complaint Status Updated: ${complaint.complaintId}`,
        message: `Hello ${complaint.citizen.name},\n\nYour complaint status has been updated.\n\nComplaint ID: ${complaint.complaintId}\nTitle: ${complaint.title}\nNew Status: ${status || complaint.status}\nOfficer: ${officer.name}\n\n${notes ? `Officer Notes: ${notes}\n` : ''}${resolutionDetails ? `Resolution: ${resolutionDetails}\n` : ''}\n\nThank you for reporting this issue.\n\nBest regards,\nSmart City Team`,
      });
    }
  } catch (err) {
    console.error('Error sending email:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Complaint updated successfully',
    data: complaint,
  });
});

// @desc    Get officer's performance metrics
// @route   GET /api/officers/:id/performance
// @access  Private
export const getOfficerPerformance = asyncHandler(async (req, res, next) => {
  const officer = await Officer.findById(req.params.id);
  if (!officer) {
    return next(new AppError('Officer not found', 404));
  }

  const complaints = await Complaint.find({ assignedOfficer: req.params.id });

  const metrics = {
    totalAssigned: officer.assignedCount,
    resolved: officer.resolvedCount,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolutionRate: officer.assignedCount ? ((officer.resolvedCount / officer.assignedCount) * 100).toFixed(2) : 0,
    averageResolutionTime: officer.averageResolutionTime,
    performanceRating: officer.performanceRating,
  };

  res.status(200).json({
    success: true,
    data: metrics,
  });
});

// @desc    Delete officer
// @route   DELETE /api/officers/:id
// @access  Private (admin only)
export const deleteOfficer = asyncHandler(async (req, res, next) => {
  const officer = await Officer.findByIdAndDelete(req.params.id);
  if (!officer) {
    return next(new AppError('Officer not found', 404));
  }

  // Unassign all complaints from this officer
  await Complaint.updateMany(
    { assignedOfficer: req.params.id },
    { assignedOfficer: null, officerAssignedAt: null }
  );

  res.status(200).json({
    success: true,
    message: 'Officer deleted successfully',
  });
});

// @desc    Bulk assign complaints to officers (Bot functionality)
// @route   POST /api/officers/bulk-assign
// @access  Private (admin only)
export const bulkAssignComplaints = asyncHandler(async (req, res, next) => {
  // Get all pending complaints without assigned officers
  const pendingComplaints = await Complaint.find({
    status: 'pending',
    assignedOfficer: null,
  });

  let assignedCount = 0;
  const assignmentResults = [];

  for (const complaint of pendingComplaints) {
    // Find the best officer for this complaint based on department and ward
    const availableOfficers = await Officer.find({
      department: complaint.department,
      isActive: true,
      isAvailable: true,
      'jurisdiction.wards': complaint.location.ward,
    }).sort({ assignedCount: 1 }); // Sort by least assigned

    if (availableOfficers.length === 0) {
      // If no officer with specific ward, find by department
      const departmentOfficers = await Officer.find({
        department: complaint.department,
        isActive: true,
        isAvailable: true,
      }).sort({ assignedCount: 1 });

      if (departmentOfficers.length > 0) {
        availableOfficers.push(departmentOfficers[0]);
      }
    }

    if (availableOfficers.length > 0) {
      const officer = availableOfficers[0];

      // Create transfer record
      const transfer = await ComplaintTransfer.create({
        complaint: complaint._id,
        fromDepartment: complaint.department,
        toDepartment: officer.department,
        toOfficer: officer._id,
        transferReason: 'auto_routing',
        notes: 'Automatically assigned by bot',
      });

      // Update complaint
      complaint.assignedOfficer = officer._id;
      complaint.officerAssignedAt = new Date();
      complaint.transfers.push(transfer._id);
      complaint.status = 'under_review';
      complaint.statusHistory.push({
        status: 'under_review',
        comment: `Auto-assigned to ${officer.designation} ${officer.name}`,
      });
      await complaint.save();

      // Update officer
      officer.assignedComplaints.push(complaint._id);
      officer.assignedCount = officer.assignedComplaints.length;
      await officer.save();

      assignedCount++;
      assignmentResults.push({
        complaintId: complaint.complaintId,
        officer: officer.name,
        status: 'assigned',
      });

      // Send notification emails
      try {
        await sendEmail({
          email: officer.email,
          subject: `New Complaint Auto-Assigned: ${complaint.complaintId}`,
          message: `Hello ${officer.name},\n\nA complaint has been automatically assigned to you.\n\nComplaint ID: ${complaint.complaintId}\nTitle: ${complaint.title}\nCategory: ${complaint.category}\nLocation: ${complaint.location.address}\n\nPlease review and take action as soon as possible.\n\nBest regards,\nSmart City Team`,
        });
      } catch (err) {
        console.error('Error sending email:', err);
      }
    } else {
      assignmentResults.push({
        complaintId: complaint.complaintId,
        status: 'no_available_officer',
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `${assignedCount} complaints assigned successfully`,
    assignedCount,
    totalPending: pendingComplaints.length,
    results: assignmentResults,
  });
});
