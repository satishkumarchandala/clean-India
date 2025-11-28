import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './AdminDashboard.css';
const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    resolvedIssues: 0,
    totalUsers: 0,
  });

  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchIssues();
  }, []);

  useEffect(() => {
    filterAndSortIssues();
  }, [issues, filter, searchTerm, sortBy]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await api.get('/api/admin/issues');
      setIssues(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
      setLoading(false);
    }
  };

  const filterAndSortIssues = () => {
    let filtered = [...issues];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter((issue) => issue.status === filter);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

    setFilteredIssues(filtered);
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      await api.put(`/api/admin/issues/${issueId}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchIssues();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/issues/${issueId}`);
      toast.success('Issue deleted successfully');
      fetchIssues();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete issue');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      'in-progress': '#3498db',
      resolved: '#27ae60',
      rejected: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#e74c3c',
      medium: '#f39c12',
      low: '#3498db',
    };
    return colors[priority] || '#95a5a6';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="container">
        <div className="admin-header">
          <h1>🎛️ Admin Dashboard</h1>
          <div className="header-actions">
            {user?.role === 'super_admin' && (
              <Link to="/admin/organizations" className="btn btn-warning">
                <i className="fas fa-building"></i> Manage Organizations
              </Link>
            )}
            <Link to="/" className="btn btn-secondary">
              <i className="fas fa-home"></i> Back to Home
            </Link>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalIssues}</div>
              <div className="stat-label">Total Issues</div>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingIssues}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card resolved">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.resolvedIssues}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>

          <div className="stat-card users">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="filters-section">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>
                <i className="fas fa-filter"></i> Status:
              </label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Issues</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label>
                <i className="fas fa-sort"></i> Sort By:
              </label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="createdAt">Date</option>
                <option value="upvotes">Upvotes</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          <div className="results-info">
            Showing {filteredIssues.length} of {issues.length} issues
          </div>

          {filteredIssues.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-inbox"></i>
              <p>No issues found matching your filters</p>
            </div>
          ) : (
            <div className="issues-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Reporter</th>
                    <th>Upvotes</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr key={issue._id}>
                      <td className="issue-title-col">
                        <Link to={`/issues/${issue._id}`}>{issue.title}</Link>
                      </td>
                      <td>
                        <span className={`badge badge-${issue.category}`}>{issue.category}</span>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          style={{ backgroundColor: getStatusColor(issue.status) }}
                          value={issue.status}
                          onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(issue.priority) }}
                        >
                          {issue.priority.toUpperCase()}
                        </span>
                      </td>
                      <td>{issue.reportedBy?.name || 'Anonymous'}</td>
                      <td className="upvotes-col">
                        <i className="fas fa-thumbs-up"></i> {issue.upvotes}
                      </td>
                      <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                      <td className="actions-col">
                        <Link to={`/issues/${issue._id}`} className="btn-icon btn-view" title="View">
                          <i className="fas fa-eye"></i>
                        </Link>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(issue._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
