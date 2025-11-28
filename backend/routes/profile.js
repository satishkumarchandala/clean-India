import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Apply protect middleware to all profile routes
router.use(protect);

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('organization', 'name category description');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', upload.single('profilePicture'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().trim(),
  body('bio').optional().trim(),
  body('location').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, bio, location } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    
    // Add profile picture if uploaded
    if (req.file) {
      updateData.profilePicture = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('organization', 'name category');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/profile/issues
// @desc    Get user's reported issues
// @access  Private
router.get('/issues', async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user._id })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/profile/password
// @desc    Update user password
// @access  Private
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
