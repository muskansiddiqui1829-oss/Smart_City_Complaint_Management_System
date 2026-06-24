import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'resolved', 'rejected', 'closed'],
    required: true,
  },
  comment: { type: String, trim: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'health', 'general', 'noise', 'illegal_construction', 'public_transport'],
  },
  subCategory: {
    type: String,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'resolved', 'rejected', 'closed'],
    default: 'pending',
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  department: {
    type: String,
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'health', 'general', null],
    default: null,
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    ward: { type: String, trim: true },
    city: { type: String, trim: true, default: 'Smart City' },
    pincode: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  images: [{
    url: { type: String },
    publicId: { type: String },
    caption: { type: String },
  }],
  statusHistory: [statusHistorySchema],
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
  },
  resolutionDetails: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution details cannot exceed 1000 characters'],
  },
  resolvedAt: Date,
  expectedResolutionDate: Date,
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: { type: String, trim: true, maxlength: 500 },
    ratedAt: Date,
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  views: { type: Number, default: 0 },
  isAnonymous: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }],
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: upvote count
complaintSchema.virtual('upvoteCount').get(function () {
  return this.upvotes ? this.upvotes.length : 0;
});

// Auto-generate complaintId before saving
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = `SC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Add to status history on status change
complaintSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    // Handled in controller with comment
  }
  next();
});

// Text search index
complaintSchema.index({ title: 'text', description: 'text', 'location.address': 'text' });
complaintSchema.index({ status: 1, category: 1, createdAt: -1 });
complaintSchema.index({ citizen: 1, createdAt: -1 });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ complaintId: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
