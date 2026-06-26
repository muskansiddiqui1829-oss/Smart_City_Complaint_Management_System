import mongoose from 'mongoose';

const complaintTransferSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
  },
  fromDepartment: {
    type: String,
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'health', 'general'],
  },
  toDepartment: {
    type: String,
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'health', 'general'],
    required: true,
  },
  toOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    required: true,
  },
  transferredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // admin or department head
  },
  transferReason: {
    type: String,
    required: true,
    enum: ['auto_routing', 'manual_assignment', 'escalation', 'reassignment', 'expertise'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  acceptedAt: Date,
  rejectionReason: String,
  completedAt: Date,
  transferredAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
complaintTransferSchema.index({ complaint: 1 });
complaintTransferSchema.index({ toOfficer: 1, status: 1 });
complaintTransferSchema.index({ transferredAt: -1 });
complaintTransferSchema.index({ transferReason: 1 });

export default mongoose.model('ComplaintTransfer', complaintTransferSchema);
