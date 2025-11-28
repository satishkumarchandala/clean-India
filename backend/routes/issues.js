import express from 'express';
import { body, validationResult } from 'express-validator';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { sendEmail, generateIssueReportEmail } from '../utils/email.js';
import { calculatePriorityScore } from '../utils/priorityScoring.js';

const router = express.Router();

// @route   GET /api/issues
// @desc    Get all issues with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, status, search, userId, orgCategory } = req.query;
    
    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by organization category
    if (orgCategory && orgCategory !== 'general') {
      const categoryMap = {
        'electricity': 'electricity',
        'water': 'water',
        'road': 'road',
        'transport': 'transport',
        'sanitation': 'sanitation',
        'dustbin': 'sanitation',
        'others': 'others',
      };
      const mappedCategory = categoryMap[orgCategory];
      if (mappedCategory) {
        query.category = mappedCategory;
      }
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by user
    if (userId) {
      query.reportedBy = userId;
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/issues/stats
// @desc    Get issue statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const { orgCategory } = req.query;
    
    let matchQuery = {};
    if (orgCategory && orgCategory !== 'general') {
      const categoryMap = {
        'electricity': 'electricity',
        'water': 'water',
        'road': 'road',
        'transport': 'transport',
        'sanitation': 'sanitation',
        'dustbin': 'sanitation',
        'others': 'others',
      };
      const mappedCategory = categoryMap[orgCategory];
      if (mappedCategory) {
        matchQuery.category = mappedCategory;
      }
    }

    const stats = await Issue.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          categoryCounts: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
          ],
          priorityCounts: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const totalIssues = await Issue.countDocuments(matchQuery);
    const totalUsers = await User.countDocuments({ role: 'user' });

    res.json({
      success: true,
      data: {
        totalIssues,
        totalUsers,
        ...stats[0],
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/issues/:id
// @desc    Get single issue by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email phone location')
      .populate('assignedTo', 'name email');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Get comments for this issue
    const comments = await Comment.find({ issue: issue._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...issue.toObject(),
        comments,
      },
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private
router.post('/', protect, uploadLimiter, upload.single('image'), [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('category').isIn(['road', 'electricity', 'water', 'sanitation', 'transport', 'infrastructure', 'environment', 'others']).withMessage('Invalid category'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('address').trim().isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if user profile is complete
    if (!req.user.isProfileComplete()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete your profile before reporting issues',
        profileComplete: false,
      });
    }

    const { title, description, category, priority, latitude, longitude, address } = req.body;

    // Validate coordinates are not 0,0
    if (parseFloat(latitude) === 0 && parseFloat(longitude) === 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid location coordinates' });
    }

    const issueData = {
      title,
      description,
      category,
      priority: priority || 'medium',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      address,
      reportedBy: req.user._id,
    };

    // Add image if uploaded
    if (req.file) {
      issueData.image = req.file.filename;
    }

    const issue = await Issue.create(issueData);
    
    // Calculate priority score
    const priorityData = calculatePriorityScore(issue);
    issue.priority = priorityData.priority;
    issue.priorityScore = priorityData.score;
    issue.priorityBreakdown = priorityData.breakdown;
    await issue.save();
    
    // Populate reporter info
    await issue.populate('reportedBy', 'name email');

    // Send confirmation email
    try {
      const emailBody = generateIssueReportEmail(req.user.name, title, category, issue._id);
      await sendEmail(req.user.email, '✅ Issue Reported Successfully', emailBody);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: issue,
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/issues/:id/comments
// @desc    Add a comment to an issue
// @access  Private
router.post('/:id/comments', protect, [
  body('comment').trim().notEmpty().withMessage('Comment cannot be empty'),
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

    const { comment } = req.body;
    const isOfficial = ['super_admin', 'org_admin', 'org_staff'].includes(req.user.role);

    const newComment = await Comment.create({
      issue: req.params.id,
      user: req.user._id,
      comment,
      isOfficial,
    });

    await newComment.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/issues/:id/upvote
// @desc    Upvote an issue
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Check if user already upvoted
    const hasUpvoted = issue.upvotedBy.includes(req.user._id);
    
    if (hasUpvoted) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already upvoted this issue' 
      });
    }

    // Add user to upvotedBy array and increment upvotes
    issue.upvotedBy.push(req.user._id);
    issue.upvotes = issue.upvotedBy.length;
    
    // Recalculate priority score since upvotes changed
    const priorityData = calculatePriorityScore(issue);
    issue.priority = priorityData.priority;
    issue.priorityScore = priorityData.score;
    issue.priorityBreakdown = priorityData.breakdown;
    
    await issue.save();

    res.json({
      success: true,
      message: 'Issue upvoted successfully',
      upvotes: issue.upvotes,
      priority: issue.priority,
      priorityScore: issue.priorityScore,
    });
  } catch (error) {
    console.error('Upvote issue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/issues/recalculate-priorities
// @desc    Recalculate priorities for all issues (Admin only)
// @access  Private/Admin
router.post('/recalculate-priorities', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (!['super_admin', 'org_admin', 'org_staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const issues = await Issue.find({});
    let updated = 0;

    for (const issue of issues) {
      const priorityData = calculatePriorityScore(issue);
      issue.priority = priorityData.priority;
      issue.priorityScore = priorityData.score;
      issue.priorityBreakdown = priorityData.breakdown;
      await issue.save();
      updated++;
    }

    res.json({
      success: true,
      message: `Successfully recalculated priorities for ${updated} issues`,
      count: updated,
    });
  } catch (error) {
    console.error('Recalculate priorities error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/issues/:id/comments
// @desc    Get comments for an issue
// @access  Public
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ issue: req.params.id })
      .populate('user', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
