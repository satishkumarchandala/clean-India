import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Admin middleware (super_admin, org_admin, org_staff)
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  if (!['super_admin', 'org_admin', 'org_staff'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }

  next();
};

// Super admin only
export const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super admin privileges required.' });
  }

  next();
};

// Organization admin only
export const orgAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  if (!['super_admin', 'org_admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Organization admin privileges required.' });
  }

  next();
};

// Check if user can manage a specific issue category
export const canManageIssue = (userRole, userOrgCategory, issueCategory) => {
  if (userRole === 'super_admin') {
    return true;
  }

  // Organization category to issue category mapping
  const categoryMap = {
    'electricity': 'electricity',
    'water': 'water',
    'road': 'road',
    'transport': 'transport',
    'sanitation': 'sanitation',
    'dustbin': 'sanitation',
    'general': null, // Can manage all
    'others': 'others',
  };

  const allowedCategory = categoryMap[userOrgCategory];
  
  if (allowedCategory === null) {
    return true; // General category can manage all
  }

  return allowedCategory === issueCategory;
};
