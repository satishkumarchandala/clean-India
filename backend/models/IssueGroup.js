import mongoose from 'mongoose';

const issueGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  centerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  radius: {
    type: Number, // in meters
    default: 500,
  },
  issues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active',
  },
}, {
  timestamps: true,
});

issueGroupSchema.index({ centerLocation: '2dsphere' });

export default mongoose.model('IssueGroup', issueGroupSchema);
