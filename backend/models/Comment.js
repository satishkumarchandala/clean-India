import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
  },
  isOfficial: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for faster queries
commentSchema.index({ issue: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
