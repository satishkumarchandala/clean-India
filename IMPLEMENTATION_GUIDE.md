# MERN Application Implementation Guide
## Complete Feature Implementation - Flask to MERN Migration

This guide provides all the code needed to make your MERN app a carbon copy of the Flask application.

---

## TABLE OF CONTENTS
1. [Backend Routes & Updates](#backend-routes--updates)
2. [Frontend Pages](#frontend-pages)
3. [CSS Styles](#css-styles)
4. [Installation Steps](#installation-steps)

---

## BACKEND ROUTES & UPDATES

### 1. Add Missing Profile Routes - `backend/routes/profile.js`

```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user profile with statistics
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get user statistics
    const issuesCount = await Issue.countDocuments({ reportedBy: req.user._id });
    const commentsCount = await Comment.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          issuesCount,
          commentsCount,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', protect, uploadLimiter, upload.single('profilePicture'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
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
    
    const updateData = {
      name,
      phone: phone || undefined,
      bio: bio || undefined,
      location: location || undefined,
    };

    // Handle profile picture upload
    if (req.file) {
      updateData.profilePicture = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

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

// @route   PUT /api/profile/password
// @desc    Change user password
// @access  Private
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/profile/issues
// @desc    Get user's reported issues
// @access  Private
router.get('/issues', protect, async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user._id })
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

export default router;
```

**Add to `backend/server.js`:**
```javascript
import profileRoutes from './routes/profile.js';
app.use('/api/profile', profileRoutes);
```

---

### 2. Update Admin Routes - `backend/routes/admin.js`

Add this complete file or merge with existing:

```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Comment from '../models/Comment.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendEmail, generateStatusUpdateEmail } from '../utils/email.js';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', protect, authorize('super_admin', 'org_admin', 'org_staff'), async (req, res) => {
  try {
    let query = {};
    
    // Filter by organization category for org admins/staff
    if (req.user.role !== 'super_admin' && req.user.organization) {
      const org = await Organization.findById(req.user.organization);
      if (org && org.category !== 'general') {
        const categoryMap = {
          'electricity': 'electricity',
          'water': 'water',
          'road': 'road',
          'transport': 'transport',
          'sanitation': 'sanitation',
          'dustbin': 'sanitation',
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

    let totalUsers;
    if (req.user.role === 'super_admin') {
      totalUsers = await User.countDocuments({ role: 'user' });
    } else {
      totalUsers = await User.countDocuments({ organization: req.user.organization });
    }

    const recentIssues = await Issue.find(query)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        totalIssues,
        pendingIssues,
        inProgressIssues,
        resolvedIssues,
        totalUsers,
        recentIssues,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/issues/:id/status
// @desc    Update issue status
// @access  Private (Admin)
router.put('/issues/:id/status', protect, authorize('super_admin', 'org_admin', 'org_staff'), [
  body('status').isIn(['pending', 'in-progress', 'resolved', 'rejected']).withMessage('Invalid status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status, comment } = req.body;
    
    const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name email');
    
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Check if user can manage this category
    if (req.user.role !== 'super_admin' && req.user.organization) {
      const org = await Organization.findById(req.user.organization);
      if (org && org.category !== 'general' && org.category !== issue.category) {
        return res.status(403).json({ success: false, message: 'You cannot manage this issue category' });
      }
    }

    issue.status = status;
    await issue.save();

    // Add admin comment if provided
    if (comment && comment.trim()) {
      await Comment.create({
        issue: issue._id,
        user: req.user._id,
        comment: comment.trim(),
        isOfficial: true,
      });
    }

    // Send email notification
    if (issue.reportedBy && issue.reportedBy.email) {
      try {
        const emailBody = generateStatusUpdateEmail(
          issue.reportedBy.name,
          issue.title,
          status,
          comment || '',
          issue._id
        );
        await sendEmail(
          issue.reportedBy.email,
          `Status Update: ${issue.title}`,
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

// @route   GET /api/admin/organizations
// @desc    Get all organizations (Super Admin only)
// @access  Private (Super Admin)
router.get('/organizations', protect, authorize('super_admin'), async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ name: 1 });
    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (Super Admin only)
// @access  Private (Super Admin)
router.get('/users', protect, authorize('super_admin'), async (req, res) => {
  try {
    const users = await User.find()
      .populate('organization', 'name category')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Assign user to organization with role (Super Admin only)
// @access  Private (Super Admin)
router.put('/users/:id/role', protect, authorize('super_admin'), [
  body('role').isIn(['user', 'org_staff', 'org_admin', 'super_admin']).withMessage('Invalid role'),
  body('organizationId').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { role, organizationId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    user.organization = organizationId || null;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
```

**Update `backend/server.js`:**
```javascript
import adminRoutes from './routes/admin.js';
app.use('/api/admin', adminRoutes);
```

---

### 3. Update Issue Model - Add upvotes field

Already done! The upvotes and upvotedBy fields have been added.

---

## FRONTEND PAGES

### 1. Complete IssueDetail Page - `frontend/src/pages/IssueDetail.jsx`

**REPLACE ENTIRE FILE:**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './IssueDetail.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', comment: '' });

  const categoryEmojis = {
    road: '🛣️',
    electricity: '⚡',
    water: '💧',
    sanitation: '🗑️',
    transport: '🚌',
    infrastructure: '🏗️',
    environment: '🌳',
    others: '📋',
  };

  const statusEmojis = {
    pending: '⏳',
    'in-progress': '🔄',
    resolved: '✅',
    rejected: '❌',
  };

  useEffect(() => {
    fetchIssueDetails();
    fetchComments();
  }, [id]);

  const fetchIssueDetails = async () => {
    try {
      const response = await api.get(`/api/issues/${id}`);
      setIssue(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching issue:', error);
      toast.error('Failed to load issue details');
      navigate('/');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/api/issues/${id}/comments`);
      setComments(response.data.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleUpvote = async () => {
    if (!user) {
      toast.error('Please login to upvote');
      return;
    }

    try {
      const response = await api.post(`/api/issues/${id}/upvote`);
      toast.success(response.data.message);
      fetchIssueDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upvote');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmittingComment(true);

    try {
      await api.post(`/api/issues/${id}/comments`, { comment: newComment });
      toast.success('Comment added successfully');
      setNewComment('');
      fetchComments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/api/admin/issues/${id}/status`, statusUpdate);
      toast.success('Status updated successfully');
      setShowStatusModal(false);
      setStatusUpdate({ status: '', comment: '' });
      fetchIssueDetails();
      fetchComments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading issue details...</p>
      </div>
    );
  }

  if (!issue) {
    return <div className="container"><h2>Issue not found</h2></div>;
  }

  const isAdmin = user && ['super_admin', 'org_admin', 'org_staff'].includes(user.role);
  const hasUpvoted = user && issue.upvotedBy?.includes(user._id);

  return (
    <div className="issue-detail-container">
      <div className="container">
        <Link to="/" className="btn btn-secondary" style={{ marginBottom: '2rem', display: 'inline-block' }}>
          <i className="fas fa-arrow-left"></i> Back to Issues
        </Link>

        <div className="issue-detail-card">
          <div className="issue-header">
            <div>
              <h1 className="issue-title">{issue.title}</h1>
              <div className="issue-meta">
                <span className={`badge badge-${issue.category}`}>
                  {categoryEmojis[issue.category] || '📋'} {issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}
                </span>
                <span className={`badge badge-${issue.status}`}>
                  {statusEmojis[issue.status] || '📋'} {issue.status.replace('-', ' ').toUpperCase()}
                </span>
                <span className="badge" style={{ background: '#f1c40f', color: '#2c3e50' }}>
                  📊 {issue.priority.toUpperCase()} Priority
                </span>
              </div>
            </div>

            {isAdmin && (
              <button className="btn btn-warning" onClick={() => setShowStatusModal(true)}>
                <i className="fas fa-edit"></i> Update Status
              </button>
            )}
          </div>

          <div className="issue-location">
            <i className="fas fa-map-marker-alt"></i>
            {issue.address}
            <span style={{ marginLeft: '1rem', color: '#666' }}>
              ({issue.location.coordinates[1].toFixed(6)}, {issue.location.coordinates[0].toFixed(6)})
            </span>
          </div>

          <div className="issue-description">
            {issue.description}
          </div>

          {issue.image && (
            <div className="issue-image">
              <img src={`/api/uploads/${issue.image}`} alt="Issue" />
            </div>
          )}

          <div className="map-container">
            <MapContainer
              center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
              zoom={15}
              style={{ height: '400px', width: '100%', borderRadius: '10px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[issue.location.coordinates[1], issue.location.coordinates[0]]}>
                <Popup>
                  <strong>{issue.title}</strong><br />
                  {issue.address}
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="issue-actions">
            {user ? (
              hasUpvoted ? (
                <button className="upvote-btn upvoted" disabled>
                  <i className="fas fa-thumbs-up"></i>
                  <span>{issue.upvotes}</span> Already Upvoted
                </button>
              ) : (
                <button className="upvote-btn" onClick={handleUpvote}>
                  <i className="fas fa-thumbs-up"></i>
                  <span>{issue.upvotes}</span> Upvotes
                </button>
              )
            ) : (
              <button className="upvote-btn" disabled title="Login to upvote">
                <i className="fas fa-thumbs-up"></i>
                <span>{issue.upvotes}</span> Upvotes
              </button>
            )}

            <div style={{ marginLeft: 'auto', color: '#666' }}>
              <i className="fas fa-user"></i> {issue.reportedBy?.name || 'Anonymous'} |
              <i className="fas fa-calendar"></i> {new Date(issue.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="comments-section">
          <h2>
            <i className="fas fa-comments"></i> Community Discussion ({comments.length})
          </h2>

          {user ? (
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                className="form-control"
                placeholder="Share your thoughts or provide updates..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={submittingComment}>
                {submittingComment ? '📤 Posting...' : '📤 Post Comment'}
              </button>
            </form>
          ) : (
            <div className="login-prompt">
              <p>Please login to join the discussion</p>
              <Link to="/login" className="btn btn-primary">
                <i className="fas fa-sign-in-alt"></i> Login to Comment
              </Link>
            </div>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className={`comment-card ${comment.isOfficial ? 'official' : ''}`}>
                  <div className="comment-header">
                    <div className="comment-author">
                      <div className="author-avatar">
                        {comment.user?.profilePicture ? (
                          <img src={`/api/uploads/${comment.user.profilePicture}`} alt={comment.user.name} />
                        ) : (
                          <i className="fas fa-user-circle"></i>
                        )}
                      </div>
                      <div>
                        <strong>{comment.user?.name || 'Anonymous'}</strong>
                        {comment.isOfficial && <span className="official-badge">✓ Official</span>}
                        <div className="comment-date">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="comment-content">{comment.comment}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Issue Status</h2>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-control"
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="resolved">✅ Resolved</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Comment (Optional)</label>
                <textarea
                  id="comment"
                  className="form-control"
                  value={statusUpdate.comment}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                  rows={4}
                  placeholder="Add a comment about this status update..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetail;
```

---

## CSS STYLES

### IssueDetail.css

```css
.issue-detail-container {
  min-height: 100vh;
  background: var(--light);
  padding: 40px 0;
}

.issue-detail-card {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
  margin-bottom: 30px;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--light);
}

.issue-title {
  font-size: 32px;
  color: var(--dark);
  margin-bottom: 15px;
}

.issue-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.issue-location {
  background: var(--light);
  padding: 15px 20px;
  border-radius: 10px;
  margin-bottom: 25px;
  font-size: 16px;
  color: var(--dark);
}

.issue-location i {
  color: var(--primary);
  margin-right: 8px;
}

.issue-description {
  font-size: 18px;
  line-height: 1.8;
  color: var(--dark);
  margin-bottom: 30px;
}

.issue-image {
  margin: 30px 0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.issue-image img {
  width: 100%;
  height: auto;
  display: block;
}

.map-container {
  margin: 30px 0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.issue-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--gray-light);
}

.upvote-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.upvote-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.upvote-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upvote-btn.upvoted {
  background: var(--success);
}

.comments-section {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
}

.comments-section h2 {
  margin-bottom: 30px;
  color: var(--dark);
}

.comment-form {
  margin-bottom: 40px;
}

.comment-form textarea {
  margin-bottom: 15px;
}

.login-prompt {
  background: var(--light);
  padding: 30px;
  text-align: center;
  border-radius: 10px;
  margin-bottom: 40px;
}

.login-prompt p {
  margin-bottom: 15px;
  color: var(--gray);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.no-comments {
  text-align: center;
  color: var(--gray);
  padding: 40px;
  font-size: 18px;
}

.comment-card {
  background: var(--light);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid var(--primary);
}

.comment-card.official {
  background: #e8f5e9;
  border-left-color: var(--success);
}

.comment-header {
  margin-bottom: 15px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-author strong {
  color: var(--dark);
}

.official-badge {
  background: var(--success);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 8px;
  font-weight: 600;
}

.comment-date {
  color: var(--gray);
  font-size: 14px;
  margin-top: 2px;
}

.comment-content {
  color: var(--dark);
  line-height: 1.6;
  font-size: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: 25px;
  color: var(--dark);
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 25px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid var(--light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .issue-detail-card {
    padding: 20px;
  }

  .issue-title {
    font-size: 24px;
  }

  .issue-header {
    flex-direction: column;
    gap: 20px;
  }

  .issue-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .comments-section {
    padding: 20px;
  }
}
```

---

## Continue in next message...

This file is getting large. I'll create separate guide files for:
- Profile Page Implementation
- Admin Dashboard  
- Issues Map
- All other missing features

Would you like me to continue with the next parts?

