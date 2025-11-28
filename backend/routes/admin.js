import express from 'express';
import { body, validationResult } from 'express-validator';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Comment from '../models/Comment.js';
import { protect, adminOnly, superAdminOnly, canManageIssue } from '../middleware/auth.js';
import { sendEmail, generateStatusUpdateEmail } from '../utils/email.js';

const router = express.Router();

// Apply protect middleware to all admin routes
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter by organization category if not super admin
    if (userRole !== 'super_admin' && req.user.organization) {
      const org = await Organization.findById(req.user.organization);
      if (org && org.category !== 'general') {
        const categoryMap = {
          'electricity': 'electricity',
          'water': 'water',
          'road': 'road',
          'transport': 'transport',
          'sanitation': 'sanitation',
          'dustbin': 'sanitation',
          'others': 'others',
        };
        const mappedCategory = categoryMap[org.category];
        if (mappedCategory) {
          query.category = mappedCategory;
        }
      }
    }

    const totalIssues = await Issue.countDocuments(query);
    const pendingIssues = await Issue.countDocuments({ ...query, status: 'pending' });
    const inProgressIssues = await Issue.countDocuments({ ...query, status: 'in-progress' });
    const resolvedIssues = await Issue.countDocuments({ ...query, status: 'resolved' });

    // Get user count
    let totalUsers;
    if (userRole === 'super_admin') {
      totalUsers = await User.countDocuments({ role: 'user' });
    } else {
      totalUsers = await User.countDocuments({ organization: req.user.organization, role: 'user' });
    }

    // Get recent issues
    const recentIssues = await Issue.find(query)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalIssues,
          pendingIssues,
          inProgressIssues,
          resolvedIssues,
          totalUsers,
        },
        recentIssues,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin stats (alias for dashboard for compatibility)
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (userRole !== 'super_admin' && req.user.organization) {
      const org = await Organization.findById(req.user.organization);
      if (org && org.category !== 'general') {
        const categoryMap = {
          'electricity': 'electricity',
          'water': 'water',
          'road': 'road',
          'transport': 'transport',
          'sanitation': 'sanitation',
          'dustbin': 'sanitation',
          'others': 'others',
        };
        const mappedCategory = categoryMap[org.category];
        if (mappedCategory) {
          query.category = mappedCategory;
        }
      }
    }

    const totalIssues = await Issue.countDocuments(query);
    const pendingIssues = await Issue.countDocuments({ ...query, status: 'pending' });
    const resolvedIssues = await Issue.countDocuments({ ...query, status: 'resolved' });

    let totalUsers;
    if (userRole === 'super_admin') {
      totalUsers = await User.countDocuments({ role: 'user' });
    } else {
      totalUsers = await User.countDocuments({ organization: req.user.organization, role: 'user' });
    }

    res.json({
      success: true,
      data: {
        totalIssues,
        pendingIssues,
        resolvedIssues,
        totalUsers,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/issues
// @desc    Get all issues for admin
// @access  Private/Admin
router.get('/issues', async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (userRole !== 'super_admin' && req.user.organization) {
      const org = await Organization.findById(req.user.organization);
      if (org && org.category !== 'general') {
        const categoryMap = {
          'electricity': 'electricity',
          'water': 'water',
          'road': 'road',
          'transport': 'transport',
          'sanitation': 'sanitation',
          'dustbin': 'sanitation',
          'others': 'others',
        };
        const mappedCategory = categoryMap[org.category];
        if (mappedCategory) {
          query.category = mappedCategory;
        }
      }
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/issues/:id
// @desc    Delete an issue
// @access  Private/Admin
router.delete('/issues/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Delete associated comments
    await Comment.deleteMany({ issue: req.params.id });

    // Delete the issue
    await Issue.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/issues/:id/status
// @desc    Update issue status
// @access  Private/Admin
router.put('/issues/:id/status', [
  body('status').isIn(['pending', 'in-progress', 'resolved', 'rejected']).withMessage('Invalid status'),
  body('comment').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name email');
    
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Check if user can manage this issue category
    let orgCategory = null;
    if (req.user.organization) {
      const org = await Organization.findById(req.user.organization);
      orgCategory = org ? org.category : null;
    }

    if (!canManageIssue(req.user.role, orgCategory, issue.category)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to manage this issue category' 
      });
    }

    const { status, comment } = req.body;

    // Update status
    issue.status = status;
    await issue.save();

    // Add admin comment if provided
    if (comment) {
      await Comment.create({
        issue: issue._id,
        user: req.user._id,
        comment,
        isOfficial: true,
      });
    }

    // Send status update email
    if (issue.reportedBy && issue.reportedBy.email) {
      try {
        const emailBody = generateStatusUpdateEmail(
          issue.reportedBy.name,
          issue.title,
          status,
          comment || '',
          issue._id
        );
        const statusEmojis = {
          'pending': '⏳',
          'in-progress': '🔄',
          'resolved': '✅',
          'rejected': '❌',
        };
        await sendEmail(
          issue.reportedBy.email,
          `${statusEmojis[status]} Status Update: ${issue.title}`,
          emailBody
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: issue,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/issues/:id/assign
// @desc    Assign issue to staff
// @access  Private/Admin
router.put('/issues/:id/assign', [
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const { assignedTo } = req.body;

    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      issue.assignedTo = assignedTo;
    } else {
      issue.assignedTo = null;
    }

    await issue.save();
    await issue.populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Issue assigned successfully',
      data: issue,
    });
  } catch (error) {
    console.error('Assign issue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/issues/:id
// @desc    Delete an issue
// @access  Private/SuperAdmin
router.delete('/issues/:id', superAdminOnly, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Delete associated comments
    await Comment.deleteMany({ issue: issue._id });

    // Delete issue
    await issue.deleteOne();

    res.json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    let query = {};

    // Non-super admins only see users from their organization
    if (req.user.role !== 'super_admin' && req.user.organization) {
      query.organization = req.user.organization;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('organization', 'name category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/organizations
// @desc    Get all organizations
// @access  Private/SuperAdmin
router.get('/organizations', superAdminOnly, async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ name: 1 });

    res.json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/organizations
// @desc    Create a new organization
// @access  Private/SuperAdmin
router.post('/organizations', superAdminOnly, [
  body('name').trim().notEmpty().withMessage('Organization name is required'),
  body('category').isIn(['electricity', 'water', 'road', 'transport', 'sanitation', 'dustbin', 'general', 'others']).withMessage('Invalid category'),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, category, description } = req.body;

    const organization = await Organization.create({
      name,
      category,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
