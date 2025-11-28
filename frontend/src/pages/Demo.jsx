import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Demo.css';

const Demo = () => {
  const [activeTab, setActiveTab] = useState('features');

  const features = [
    {
      icon: '📍',
      title: 'Report Issues',
      description: 'Easily report civic issues with photos, GPS location, and detailed descriptions',
      demo: 'Citizens can report issues like potholes, broken streetlights, water leaks, and more',
    },
    {
      icon: '🗺️',
      title: 'Interactive Map',
      description: 'View all reported issues on an interactive map with real-time updates',
      demo: 'Color-coded markers show issue status: Pending, In Progress, Resolved, or Rejected',
    },
    {
      icon: '👍',
      title: 'Upvote System',
      description: 'Support important issues by upvoting them to increase their priority',
      demo: 'Popular issues get more attention from authorities based on community support',
    },
    {
      icon: '💬',
      title: 'Comments & Updates',
      description: 'Stay informed with official updates and community discussions',
      demo: 'Receive notifications when authorities update the status of your reported issues',
    },
    {
      icon: '🎯',
      title: 'Priority Scoring',
      description: 'AI-powered system automatically assigns priority based on multiple factors',
      demo: 'Severity, location, community impact, and safety concerns determine priority',
    },
    {
      icon: '🎛️',
      title: 'Admin Dashboard',
      description: 'Government officials can manage and resolve issues efficiently',
      demo: 'Track statistics, filter issues, update status, and communicate with citizens',
    },
  ];

  const demoIssues = [
    {
      id: 1,
      title: 'Large Pothole on Main Street',
      category: 'road',
      status: 'in-progress',
      priority: 'high',
      upvotes: 45,
      image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400',
      description: 'Deep pothole causing traffic hazards near the school zone',
    },
    {
      id: 2,
      title: 'Streetlight Not Working',
      category: 'electricity',
      status: 'pending',
      priority: 'medium',
      upvotes: 23,
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
      description: 'Street light has been out for 2 weeks, creating safety concerns',
    },
    {
      id: 3,
      title: 'Water Pipeline Leak',
      category: 'water',
      status: 'resolved',
      priority: 'high',
      upvotes: 67,
      image: 'https://images.unsplash.com/photo-1582719471216-a72e75d8f9e9?w=400',
      description: 'Major water leak wasting resources and flooding the street',
    },
  ];

  const stats = {
    totalIssues: 1248,
    resolvedIssues: 892,
    activeCitizens: 3567,
    avgResponseTime: '48 hours',
  };

  return (
    <div className="demo-container">
      <div className="demo-hero">
        <div className="container">
          <h1>🏙️ Urban Issue Reporter</h1>
          <p className="demo-subtitle">
            Empowering citizens to make their cities better through collaborative issue reporting
          </p>
          <div className="demo-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started - It's Free
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="demo-stats">
        <div className="container">
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-number">{stats.totalIssues.toLocaleString()}</div>
              <div className="stat-label">Issues Reported</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.resolvedIssues.toLocaleString()}</div>
              <div className="stat-label">Issues Resolved</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.activeCitizens.toLocaleString()}</div>
              <div className="stat-label">Active Citizens</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.avgResponseTime}</div>
              <div className="stat-label">Avg Response Time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-tabs">
        <div className="container">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button
              className={`tab-btn ${activeTab === 'examples' ? 'active' : ''}`}
              onClick={() => setActiveTab('examples')}
            >
              Live Examples
            </button>
            <button
              className={`tab-btn ${activeTab === 'how-it-works' ? 'active' : ''}`}
              onClick={() => setActiveTab('how-it-works')}
            >
              How It Works
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'features' && (
              <div className="features-grid">
                {features.map((feature, index) => (
                  <div key={index} className="feature-card">
                    <div className="feature-icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                    <p className="feature-demo">{feature.demo}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="examples-section">
                <h2>Recent Community Reports</h2>
                <div className="demo-issues-grid">
                  {demoIssues.map((issue) => (
                    <div key={issue.id} className="demo-issue-card">
                      <img src={issue.image} alt={issue.title} className="demo-issue-image" />
                      <div className="demo-issue-content">
                        <div className="demo-issue-badges">
                          <span className={`badge badge-${issue.status}`}>
                            {issue.status.replace('-', ' ')}
                          </span>
                          <span className={`badge badge-${issue.priority}`}>
                            {issue.priority} priority
                          </span>
                        </div>
                        <h3>{issue.title}</h3>
                        <p>{issue.description}</p>
                        <div className="demo-issue-footer">
                          <span className={`badge badge-${issue.category}`}>
                            {issue.category}
                          </span>
                          <span className="upvotes">
                            👍 {issue.upvotes} upvotes
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="demo-note">
                  These are sample issues. <Link to="/register">Register</Link> to see real-time community reports.
                </p>
              </div>
            )}

            {activeTab === 'how-it-works' && (
              <div className="how-it-works">
                <div className="steps-grid">
                  <div className="step-card">
                    <div className="step-number">1</div>
                    <h3>Create Account</h3>
                    <p>Sign up with your email in under a minute. It's completely free!</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number">2</div>
                    <h3>Report Issue</h3>
                    <p>Take a photo, add location, and describe the problem. Our system automatically detects your GPS location.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number">3</div>
                    <h3>Community Support</h3>
                    <p>Others can upvote your issue, increasing its priority and visibility to authorities.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number">4</div>
                    <h3>Get Updates</h3>
                    <p>Receive notifications when authorities update the status or resolve your reported issue.</p>
                  </div>
                </div>

                <div className="role-section">
                  <h2>For Different Users</h2>
                  <div className="roles-grid">
                    <div className="role-card">
                      <div className="role-icon">👥</div>
                      <h3>Citizens</h3>
                      <ul>
                        <li>Report civic issues instantly</li>
                        <li>Track issue status in real-time</li>
                        <li>Upvote community concerns</li>
                        <li>Comment and discuss solutions</li>
                      </ul>
                    </div>
                    <div className="role-card">
                      <div className="role-icon">🏛️</div>
                      <h3>Government Officials</h3>
                      <ul>
                        <li>Manage issues efficiently</li>
                        <li>Update status with comments</li>
                        <li>View statistics and analytics</li>
                        <li>Filter by category and priority</li>
                      </ul>
                    </div>
                    <div className="role-card">
                      <div className="role-icon">👨‍💼</div>
                      <h3>Organization Admins</h3>
                      <ul>
                        <li>Manage department-specific issues</li>
                        <li>Assign tasks to staff members</li>
                        <li>Monitor team performance</li>
                        <li>Generate reports and insights</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="demo-cta-section">
        <div className="container">
          <h2>Ready to Make Your City Better?</h2>
          <p>Join thousands of citizens working together to improve their communities</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Reporting Issues Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Demo;
