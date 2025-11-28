import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import './Home.css';

const Home = () => {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });
  
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [filters, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      // Add org category filter for org admins/staff
      if (user?.organization?.category && user.organization.category !== 'general') {
        params.append('orgCategory', user.organization.category);
      }

      const [issuesRes, statsRes] = await Promise.all([
        api.get(`/api/issues?${params.toString()}`),
        api.get(`/api/issues/stats${user?.organization ? `?orgCategory=${user.organization.category}` : ''}`),
      ]);

      setIssues(issuesRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch issues');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleUpvote = async (e, issueId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to upvote');
      return;
    }

    try {
      const response = await api.post(`/api/issues/${issueId}/upvote`);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upvote');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="container">
          <h1>🏙 Urban Issue Reporter</h1>
          <p className="hero-subtitle">Making cities better, together</p>
          
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalIssues}</div>
                <div className="stat-label">Total Issues</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalUsers}</div>
                <div className="stat-label">Active Citizens</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {stats.statusCounts?.find(s => s._id === 'resolved')?.count || 0}
                </div>
                <div className="stat-label">Resolved</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {stats.statusCounts?.find(s => s._id === 'pending')?.count || 0}
                </div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <div className="filters-section">
          <div className="filters-grid">
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="road">Road</option>
                <option value="electricity">Electricity</option>
                <option value="water">Water</option>
                <option value="sanitation">Sanitation</option>
                <option value="transport">Transport</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="environment">Environment</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search issues..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="issues-section">
          <h2>Recent Issues</h2>
          {issues.length === 0 ? (
            <div className="empty-state">
              <p>No issues found. Be the first to report one!</p>
              <Link to="/report" className="btn btn-primary">Report an Issue</Link>
            </div>
          ) : (
            <div className="issues-grid">
              {issues.map((issue) => (
                <Link to={`/issue/${issue._id}`} key={issue._id} className="issue-card">
                  <div className="issue-header">
                    <span className={`badge badge-${issue.status}`}>
                      {issue.status.replace('-', ' ')}
                    </span>
                    <span className={`badge badge-${issue.priority}`}>
                      {issue.priority}
                    </span>
                  </div>
                  
                  {issue.image && (
                    <img
                      src={`http://localhost:5000/uploads/${issue.image}`}
                      alt={issue.title}
                      className="issue-image"
                    />
                  )}
                  
                  <h3>{issue.title}</h3>
                  <p className="issue-description">{issue.description.substring(0, 100)}...</p>
                  
                  <div className="issue-meta">
                    <span className="issue-category">📂 {issue.category}</span>
                    <span className="issue-location">📍 {issue.address}</span>
                  </div>
                  
                  <div className="issue-footer">
                    <span>By {issue.reportedBy?.name}</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="issue-actions">
                    <button
                      className={`upvote-btn ${user && issue.upvotedBy?.includes(user._id) ? 'upvoted' : ''}`}
                      onClick={(e) => handleUpvote(e, issue._id)}
                      disabled={!user || issue.upvotedBy?.includes(user._id)}
                    >
                      <i className="fas fa-thumbs-up"></i>
                      <span>{issue.upvotes || 0}</span>
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
