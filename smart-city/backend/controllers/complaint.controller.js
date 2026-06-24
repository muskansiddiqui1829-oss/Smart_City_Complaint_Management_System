import Complaint from '../models/Complaint.model.js';
import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/email.js';

const CATEGORY_DEPARTMENT_MAP = {
  roads: 'roads',
  water: 'water',
  electricity: 'electricity',
  sanitation: 'sanitation',
  parks: 'parks',
  health: 'health',
  general: 'general',
  noise: 'general',
  illegal_construction: 'roads',
  public_transport: 'roads',
};

// @desc    Submit a complaint
// @route   POST /api/complaints
// @access  Private (citizen)
export const submitComplaint = asyncHandler(async (req, res, next) => {
  const { title, description, category, subCategory, location, priority, isAnonymous, tags } = req.body;

  const images = req.files
    ? req.files.map(f => ({ url: f.path, publicId: f.filename }))
    : [];

  const complaint = await Complaint.create({
    title,
    description,
    category,
    subCategory,
    location: typeof location === 'string' ? JSON.parse(location) : location,
    priority: priority || 'medium',
    isAnonymous: isAnonymous === 'true' || isAnonymous === true,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
    images,
    citizen: req.user.id,
    department: CATEGORY_DEPARTMENT_MAP[category] || 'general',
    statusHistory: [{
      status: 'pending',
      comment: 'Complaint submitted by citizen',
      updatedBy: req.user.id,
    }],
  });

  await complaint.populate('citizen', 'name email phone ward');

  // Create notification for citizen
  await Notification.create({
    recipient: req.user.id,
    type: 'complaint_submitted',
    title: 'Complaint Submitted',
    message: `Your complaint "${title}" has been submitted successfully. Tracking ID: ${complaint.complaintId}`,
    complaint: complaint._id,
  });

  // Send confirmation email
  try {
    await sendEmail({
      to: complaint.citizen.email,
      subject: `Complaint Submitted - ${complaint.complaintId}`,
      template: 'complaintSubmitted',
      data: {
        name: complaint.citizen.name,
        complaintId: complaint.complaintId,
        title: complaint.title,
        category: complaint.category,
        dashboardUrl: `${process.env.FRONTEND_URL}/complaints/${complaint._id}`,
      },
    });
  } catch (err) {
    console.error('Email error:', err);
  }

  res.status(201).json({ success: true, data: complaint });
});

// @desc    Get all complaints (with filters, search, pagination)
// @route   GET /api/complaints
// @access  Private
export const getComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    priority,
    department,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    ward,
    startDate,
    endDate,
  } = req.query;

  const query = {};

  // Citizens only see their own complaints
  if (req.user.role === 'citizen') {
    query.citizen = req.user.id;
  }

  // Department heads see only their department
  if (req.user.role === 'department_head') {
    query.department = req.user.department;
  }

  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (department && req.user.role === 'admin') query.department = department;
  if (ward) query['location.ward'] = ward;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$text = { $search: search };
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('citizen', 'name email ward')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Complaint.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: complaints.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    data: complaints,
  });
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaint = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('citizen', 'name email phone ward')
    .populate('assignedTo', 'name email department')
    .populate('statusHistory.updatedBy', 'name role');

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  // Citizens can only view their own complaints
  if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  // Increment view count
  await Complaint.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.status(200).json({ success: true, data: complaint });
});

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (admin, department_head)
export const updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { status, comment, adminNotes, resolutionDetails, expectedResolutionDate } = req.body;

  const complaint = await Complaint.findById(req.params.id).populate('citizen', 'name email');
  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  // Department head can only update their department
  if (req.user.role === 'department_head' && complaint.department !== req.user.department) {
    return next(new AppError('Access denied', 403));
  }

  const previousStatus = complaint.status;
  complaint.status = status;
  complaint.statusHistory.push({
    status,
    comment: comment || `Status updated to ${status}`,
    updatedBy: req.user.id,
    timestamp: new Date(),
  });

  if (adminNotes) complaint.adminNotes = adminNotes;
  if (resolutionDetails) complaint.resolutionDetails = resolutionDetails;
  if (expectedResolutionDate) complaint.expectedResolutionDate = expectedResolutionDate;
  if (status === 'resolved') complaint.resolvedAt = new Date();

  await complaint.save();

  // Notify citizen
  await Notification.create({
    recipient: complaint.citizen._id,
    type: 'status_updated',
    title: 'Complaint Status Updated',
    message: `Your complaint ${complaint.complaintId} status has been updated to "${status}". ${comment || ''}`,
    complaint: complaint._id,
  });

  // Send email notification
  try {
    await sendEmail({
      to: complaint.citizen.email,
      subject: `Complaint Update - ${complaint.complaintId}`,
      template: 'statusUpdate',
      data: {
        name: complaint.citizen.name,
        complaintId: complaint.complaintId,
        title: complaint.title,
        previousStatus,
        newStatus: status,
        comment,
        dashboardUrl: `${process.env.FRONTEND_URL}/complaints/${complaint._id}`,
      },
    });
  } catch (err) {
    console.error('Email error:', err);
  }

  res.status(200).json({ success: true, data: complaint });
});

// @desc    Assign complaint
// @route   PUT /api/complaints/:id/assign
// @access  Private (admin)
export const assignComplaint = asyncHandler(async (req, res, next) => {
  const { assignedTo, department } = req.body;

  const complaint = await Complaint.findById(req.params.id).populate('citizen', 'name email');
  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  complaint.assignedTo = assignedTo;
  if (department) complaint.department = department;
  if (complaint.status === 'pending') {
    complaint.status = 'under_review';
    complaint.statusHistory.push({
      status: 'under_review',
      comment: 'Complaint assigned for review',
      updatedBy: req.user.id,
    });
  }

  await complaint.save();
  await complaint.populate('assignedTo', 'name email department');

  // Notify assignee
  await Notification.create({
    recipient: assignedTo,
    type: 'complaint_assigned',
    title: 'Complaint Assigned',
    message: `Complaint ${complaint.complaintId} has been assigned to you.`,
    complaint: complaint._id,
  });

  res.status(200).json({ success: true, data: complaint });
});

// @desc    Upvote a complaint
// @route   PUT /api/complaints/:id/upvote
// @access  Private (citizen)
export const upvoteComplaint = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  const userId = req.user.id;
  const hasUpvoted = complaint.upvotes.includes(userId);

  if (hasUpvoted) {
    complaint.upvotes = complaint.upvotes.filter(id => id.toString() !== userId);
  } else {
    complaint.upvotes.push(userId);
  }

  await complaint.save();
  res.status(200).json({
    success: true,
    upvoted: !hasUpvoted,
    upvoteCount: complaint.upvotes.length,
  });
});

// @desc    Rate resolved complaint
// @route   PUT /api/complaints/:id/rate
// @access  Private (citizen)
export const rateComplaint = asyncHandler(async (req, res, next) => {
  const { score, feedback } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) return next(new AppError('Complaint not found', 404));
  if (complaint.citizen.toString() !== req.user.id) return next(new AppError('Access denied', 403));
  if (complaint.status !== 'resolved') return next(new AppError('Only resolved complaints can be rated', 400));
  if (complaint.rating?.score) return next(new AppError('Complaint already rated', 400));

  complaint.rating = { score, feedback, ratedAt: new Date() };
  await complaint.save();

  res.status(200).json({ success: true, data: complaint.rating });
});

// @desc    Delete complaint (citizen own, admin any)
// @route   DELETE /api/complaints/:id
// @access  Private
export const deleteComplaint = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return next(new AppError('Complaint not found', 404));

  if (req.user.role === 'citizen') {
    if (complaint.citizen.toString() !== req.user.id) return next(new AppError('Access denied', 403));
    if (complaint.status !== 'pending') return next(new AppError('Only pending complaints can be deleted', 400));
  }

  await complaint.deleteOne();
  res.status(200).json({ success: true, message: 'Complaint deleted successfully' });
});

// @desc    Get dashboard stats
// @route   GET /api/complaints/stats
// @access  Private
export const getStats = asyncHandler(async (req, res) => {
  const matchQuery = {};
  if (req.user.role === 'citizen') matchQuery.citizen = req.user._id;
  if (req.user.role === 'department_head') matchQuery.department = req.user.department;

  const [statusStats, categoryStats, monthlyStats, recentComplaints] = await Promise.all([
    Complaint.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Complaint.aggregate([
      { $match: { ...matchQuery, createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Complaint.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('citizen', 'name')
      .lean(),
  ]);

  const statusMap = {};
  statusStats.forEach(s => { statusMap[s._id] = s.count; });

  res.status(200).json({
    success: true,
    data: {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      byStatus: statusMap,
      byCategory: categoryStats,
      monthly: monthlyStats,
      recentComplaints,
    },
  });
});

// @desc    Get public complaints feed
// @route   GET /api/complaints/public
// @access  Public
export const getPublicComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, category, status, ward } = req.query;
  const query = { isPublic: true };
  if (category) query.category = category;
  if (status) query.status = status;
  if (ward) query['location.ward'] = ward;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .select('-adminNotes -images.publicId')
      .populate('citizen', 'name ward')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Complaint.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: complaints.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    data: complaints,
  });
});
