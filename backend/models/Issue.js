import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['road', 'electricity', 'water', 'sanitation', 'transport', 'infrastructure', 'environment', 'others'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(v) {
          return v.length === 2 && v[0] !== 0 && v[1] !== 0;
        },
        message: 'Invalid coordinates',
      },
    },
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    maxlength: [500, 'Address cannot exceed 500 characters'],
    trim: true,
  },
  image: {
    type: String,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  priorityScore: {
    type: Number,
    default: 5.0,
  },
  priorityLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  priorityBreakdown: {
    type: mongoose.Schema.Types.Mixed,
  },
  aiSeverityScore: {
    type: Number,
  },
  aiCategory: {
    type: String,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IssueGroup',
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Create geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Index for common queries
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ createdAt: -1 });

export default mongoose.model('Issue', issueSchema);
