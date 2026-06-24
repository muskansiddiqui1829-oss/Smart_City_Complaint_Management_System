import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../middleware/async.middleware.js';

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { recipient: req.user.id };
  if (unreadOnly === 'true') query.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('complaint', 'complaintId title status')
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.user.id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    data: notifications,
  });
});

// @desc    Mark notifications as read
// @route   PUT /api/users/notifications/read
// @access  Private
export const markNotificationsRead = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const query = { recipient: req.user.id };
  if (ids && ids.length > 0) query._id = { $in: ids };

  await Notification.updateMany(query, { isRead: true, readAt: new Date() });
  res.status(200).json({ success: true, message: 'Notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/users/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user.id,
  });
  if (!notification) {
    const { AppError } = await import('../utils/AppError.js');
    return next(new AppError('Notification not found', 404));
  }
  res.status(200).json({ success: true, message: 'Notification deleted' });
});
