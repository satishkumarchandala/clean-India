import { useState } from 'react';
import './PriorityBreakdown.css';

const PriorityBreakdown = ({ issue }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!issue.priorityBreakdown) {
    return null;
  }

  const { priorityScore, priorityBreakdown, priority } = issue;

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#e74c3c',
      medium: '#f39c12',
      low: '#3498db',
      critical: '#c0392b',
    };
    return colors[priority] || '#95a5a6';
  };

  const getPriorityEmoji = (priority) => {
    const emojis = {
      high: '🔴',
      medium: '🟡',
      low: '🔵',
      critical: '⭕',
    };
    return emojis[priority] || '⚪';
  };

  const getScorePercentage = (score, max = 20) => {
    return Math.round((score / max) * 100);
  };

  const factorDescriptions = {
    severity: 'Based on issue category impact',
    location: 'Proximity to critical areas',
    community: 'Community support (upvotes)',
    age: 'Time since reported',
    safety: 'Safety concerns detected',
  };

  return (
    <div className="priority-breakdown-container">
      <button
        className="priority-toggle"
        onClick={() => setShowBreakdown(!showBreakdown)}
        style={{ borderLeftColor: getPriorityColor(priority) }}
      >
        <div className="priority-main">
          <span className="priority-emoji">{getPriorityEmoji(priority)}</span>
          <div className="priority-info">
            <span className="priority-label">Priority Score</span>
            <span className="priority-value">
              {priorityScore}/100 - {priority.toUpperCase()}
            </span>
          </div>
        </div>
        <i className={`fas fa-chevron-${showBreakdown ? 'up' : 'down'}`}></i>
      </button>

      {showBreakdown && (
        <div className="breakdown-details">
          <h4>📊 Priority Factor Breakdown</h4>
          <p className="breakdown-description">
            This priority score is calculated automatically based on multiple factors to help prioritize issues effectively.
          </p>

          <div className="factors-grid">
            {Object.entries(priorityBreakdown).map(([factor, score]) => (
              <div key={factor} className="factor-card">
                <div className="factor-header">
                  <span className="factor-name">
                    {factor.charAt(0).toUpperCase() + factor.slice(1)}
                  </span>
                  <span className="factor-score">{Math.round(score)}/20</span>
                </div>
                <div className="factor-progress">
                  <div
                    className="factor-progress-bar"
                    style={{
                      width: `${getScorePercentage(score)}%`,
                      backgroundColor: getPriorityColor(
                        score >= 16 ? 'high' : score >= 10 ? 'medium' : 'low'
                      ),
                    }}
                  ></div>
                </div>
                <p className="factor-description">{factorDescriptions[factor]}</p>
              </div>
            ))}
          </div>

          <div className="priority-legend">
            <h5>Priority Levels:</h5>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#e74c3c' }}></span>
                <span>High (70-100)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f39c12' }}></span>
                <span>Medium (40-69)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3498db' }}></span>
                <span>Low (0-39)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriorityBreakdown;
