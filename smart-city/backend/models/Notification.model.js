import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'complaint_submitted',
      'status_updated',
      'complaint_assigned',
      'complaint_resolved',
      'complaint_rejected',
      'comment_added',
      'rating_requested',
      'system',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
