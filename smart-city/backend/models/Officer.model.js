import mongoose from 'mongoose';

const officerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Officer name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    match: [/^\+?[\d\s\-()]{10,15}$/, 'Please enter a valid phone number'],
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: ['police', 'health_inspector', 'traffic_officer', 'sanitation_officer', 'water_manager', 'electricity_manager', 'parks_manager', 'general_officer'],
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'health', 'general'],
  },
  station: {
    type: String,
    required: [true, 'Station/Office location is required'],
    trim: true,
  },
  jurisdiction: {
    wards: [String], // List of ward numbers/names they handle
    city: { type: String, default: 'Smart City' },
  },
  assignedComplaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  assignedCount: {
    type: Number,
    default: 0,
  },
  resolvedCount: {
    type: Number,
    default: 0,
  },
  averageResolutionTime: {
    type: Number, // in days
    default: 0,
  },
  performanceRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  avatar: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
officerSchema.index({ department: 1, isActive: 1 });
officerSchema.index({ 'jurisdiction.wards': 1 });
officerSchema.index({ designation: 1 });

export default mongoose.model('Officer', officerSchema);
