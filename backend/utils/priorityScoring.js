// Priority Scoring Utilities
// Calculates priority score based on multiple factors

/**
 * Calculate priority score for an issue
 * @param {Object} issue - Issue object
 * @returns {Object} - Priority breakdown with scores
 */
export const calculatePriorityScore = (issue) => {
  const factors = {
    severity: calculateSeverityScore(issue),
    location: calculateLocationScore(issue),
    community: calculateCommunityScore(issue),
    age: calculateAgeScore(issue),
    safety: calculateSafetyScore(issue),
  };

  const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
  const maxScore = 100;
  const normalizedScore = Math.min(100, (totalScore / maxScore) * 100);

  let priority = 'low';
  if (normalizedScore >= 70) {
    priority = 'high';
  } else if (normalizedScore >= 40) {
    priority = 'medium';
  }

  return {
    priority,
    score: Math.round(normalizedScore),
    factors,
    breakdown: {
      severity: factors.severity,
      location: factors.location,
      community: factors.community,
      age: factors.age,
      safety: factors.safety,
    },
  };
};

/**
 * Calculate severity score based on category
 * High impact categories get higher scores
 */
const calculateSeverityScore = (issue) => {
  const severityMap = {
    electricity: 18,
    water: 20,
    road: 16,
    sanitation: 14,
    transport: 12,
    infrastructure: 15,
    environment: 10,
    others: 8,
  };

  return severityMap[issue.category] || 10;
};

/**
 * Calculate location score
 * Issues near schools, hospitals, etc. get higher priority
 */
const calculateLocationScore = (issue) => {
  let score = 10; // Base score

  const description = issue.description?.toLowerCase() || '';
  const title = issue.title?.toLowerCase() || '';
  const address = issue.address?.toLowerCase() || '';
  const text = `${description} ${title} ${address}`;

  // Check for high-priority locations
  const criticalLocations = [
    'school', 'hospital', 'clinic', 'market', 'junction',
    'highway', 'main road', 'bus stop', 'station'
  ];

  const hasCriticalLocation = criticalLocations.some(loc => text.includes(loc));
  if (hasCriticalLocation) {
    score += 10;
  }

  return score;
};

/**
 * Calculate community impact score based on upvotes
 */
const calculateCommunityScore = (issue) => {
  const upvotes = issue.upvotes || 0;

  if (upvotes >= 50) return 20;
  if (upvotes >= 30) return 16;
  if (upvotes >= 15) return 12;
  if (upvotes >= 5) return 8;
  return 4;
};

/**
 * Calculate age score - older unresolved issues get higher priority
 */
const calculateAgeScore = (issue) => {
  const now = new Date();
  const created = new Date(issue.createdAt);
  const daysDiff = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  if (daysDiff >= 30) return 20;
  if (daysDiff >= 14) return 15;
  if (daysDiff >= 7) return 10;
  if (daysDiff >= 3) return 6;
  return 3;
};

/**
 * Calculate safety score based on keywords
 */
const calculateSafetyScore = (issue) => {
  const description = issue.description?.toLowerCase() || '';
  const title = issue.title?.toLowerCase() || '';
  const text = `${description} ${title}`;

  const safetyKeywords = [
    'danger', 'unsafe', 'hazard', 'accident', 'broken', 'leak',
    'flooding', 'fire', 'emergency', 'urgent', 'critical',
    'exposed', 'damaged', 'collapse'
  ];

  const safetyCount = safetyKeywords.filter(keyword => text.includes(keyword)).length;

  if (safetyCount >= 3) return 20;
  if (safetyCount >= 2) return 15;
  if (safetyCount >= 1) return 10;
  return 5;
};

/**
 * Get priority color for UI
 */
export const getPriorityColor = (priority) => {
  const colors = {
    high: '#e74c3c',
    medium: '#f39c12',
    low: '#3498db',
  };
  return colors[priority] || '#95a5a6';
};

/**
 * Get priority emoji
 */
export const getPriorityEmoji = (priority) => {
  const emojis = {
    high: '🔴',
    medium: '🟡',
    low: '🔵',
  };
  return emojis[priority] || '⚪';
};

/**
 * Format score for display
 */
export const formatScore = (score) => {
  return `${Math.round(score)}/20`;
};

/**
 * Get score percentage
 */
export const getScorePercentage = (score, max = 20) => {
  return Math.round((score / max) * 100);
};
