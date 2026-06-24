import User from '../models/User.model.js';
import Complaint from '../models/Complaint.model.js';
import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { AppError } from '../utils/AppError.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    data: users,
  });
});

// @desc    Update user (role, active status)
// @route   PUT /api/admin/users/:id
// @access  Private (admin)
export const updateUser = asyncHandler(async (req, res, next) => {
  const allowedUpdates = ['role', 'isActive', 'department'];
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({ success: true, data: user });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (user.role === 'admin') return next(new AppError('Cannot delete admin accounts', 400));
  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

// @desc    Get platform-wide analytics
// @route   GET /api/admin/analytics
// @access  Private (admin)
export const getAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    statusBreakdown,
    categoryBreakdown,
    priorityBreakdown,
    departmentBreakdown,
    monthlyTrends,
    avgResolutionTime,
    satisfactionRatings,
    topWards,
  ] = await Promise.all([
    User.countDocuments({ role: 'citizen' }),
    User.countDocuments({ role: 'citizen', createdAt: { $gte: thirtyDaysAgo } }),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
    ]),
    Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Complaint.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
      { $project: { resolutionDays: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 86400000] } } },
      { $group: { _id: null, avgDays: { $avg: '$resolutionDays' } } },
    ]),
    Complaint.aggregate([
      { $match: { 'rating.score': { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$rating.score' }, count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $group: { _id: '$location.ward', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const statusMap = {};
  statusBreakdown.forEach(s => { statusMap[s._id] = s.count; });
  const totalComplaints = Object.values(statusMap).reduce((a, b) => a + b, 0);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        newUsersThisMonth,
        totalComplaints,
        resolutionRate: totalComplaints
          ? Math.round(((statusMap.resolved || 0) / totalComplaints) * 100)
          : 0,
        avgResolutionDays: avgResolutionTime[0]?.avgDays?.toFixed(1) || 0,
        avgSatisfactionScore: satisfactionRatings[0]?.avgScore?.toFixed(1) || 0,
        totalRatings: satisfactionRatings[0]?.count || 0,
      },
      byStatus: statusMap,
      byCategory: categoryBreakdown,
      byPriority: priorityBreakdown,
      byDepartment: departmentBreakdown,
      monthlyTrends,
      topWards,
    },
  });
});

// @desc    Send bulk notification
// @route   POST /api/admin/notifications/bulk
// @access  Private (admin)
export const sendBulkNotification = asyncHandler(async (req, res) => {
  const { title, message, targetRole, targetDepartment } = req.body;
  const query = { isActive: true };
  if (targetRole) query.role = targetRole;
  if (targetDepartment) query.department = targetDepartment;

  const users = await User.find(query).select('_id');
  const notifications = users.map(u => ({
    recipient: u._id,
    type: 'system',
    title,
    message,
  }));

  await Notification.insertMany(notifications);
  res.status(200).json({ success: true, message: `Notification sent to ${users.length} users` });
});

// @desc    Get all complaints (admin view)
// @route   GET /api/admin/complaints
// @access  Private (admin)
export const getAllComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, status, category, priority, department,
    search, sortBy = 'createdAt', sortOrder = 'desc',
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (department) query.department = department;
  if (search) query.$text = { $search: search };

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('citizen', 'name email phone ward')
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
