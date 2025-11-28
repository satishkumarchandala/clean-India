import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Organization category is required'],
    enum: ['electricity', 'water', 'road', 'transport', 'sanitation', 'dustbin', 'general', 'others'],
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Organization', organizationSchema);
