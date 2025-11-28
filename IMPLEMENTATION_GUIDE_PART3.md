# IMPLEMENTATION GUIDE - PART 3
## Admin Dashboard, Issues Map, and Final Steps

---

## ADMIN DASHBOARD IMPLEMENTATION

This is a LARGE file. Due to size, I'll provide the key structure and you can adapt from Flask templates.

### `frontend/src/pages/AdminDashboard.jsx`

**Key Features Needed:**
1. Statistics cards (total issues, pending, resolved, users)
2. Issues table with sorting and filtering
3. Quick action buttons
4. Status update functionality
5. Role-based content display

**Core Structure:**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/dashboard');
      setStats(response.data.data);
      setIssues(response.data.data.recentIssues);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard');
    }
  };

  const getRoleTitle = () => {
    if (user.role === 'super_admin') return 'Super Admin Dashboard';
    if (user.role === 'org_admin') return 'Organization Admin Dashboard';
    if (user.role === 'org_staff') return 'Staff Dashboard';
    return 'Admin Dashboard';
  };

  // Filter and sort logic
  const filteredIssues = issues.filter(issue => {
    if (filterStatus && issue.status !== filterStatus) return false;
    if (searchTerm && !issue.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Sort logic based on sortBy
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    switch(sortBy) {
      case 'date_desc': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'date_asc': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'priority_desc': return (b.priorityScore || 0) - (a.priorityScore || 0);
      case 'priority_asc': return (a.priorityScore || 0) - (b.priorityScore || 0);
      default: return 0;
    }
  });

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="admin-container">
      <div className="container">
        <div className="admin-header">
          <div>
            <i className="fas fa-crown" style={{fontSize: '3rem', color: 'var(--primary)'}}></i>
            <h1>{getRoleTitle()}</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats?.totalIssues || 0}</div>
            <div className="stat-label"><i className="fas fa-exclamation-circle"></i> Total Issues</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.pendingIssues || 0}</div>
            <div className="stat-label"><i className="fas fa-clock"></i> Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.resolvedIssues || 0}</div>
            <div className="stat-label"><i className="fas fa-check-circle"></i> Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.totalUsers || 0}</div>
            <div className="stat-label"><i className="fas fa-users"></i> Users</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-card">
          <h2><i className="fas fa-bolt"></i> Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/?status=pending" className="btn btn-warning">
              <i className="fas fa-clock"></i> View Pending Issues
            </Link>
            <Link to="/?status=in-progress" className="btn btn-primary">
              <i className="fas fa-spinner"></i> In-Progress Issues
            </Link>
            <Link to="/map" className="btn" style={{background: 'var(--primary)'}}>
              <i className="fas fa-map-marked-alt"></i> Issues Map
            </Link>
            {user.role === 'super_admin' && (
              <Link to="/admin/organizations" className="btn" style={{background: '#fd79a8'}}>
                <i className="fas fa-building"></i> Manage Organizations
              </Link>
            )}
          </div>
        </div>

        {/* Issues Table */}
        <div className="admin-card">
          <div className="table-header">
            <h2><i className="fas fa-list"></i> All Issues ({sortedIssues.length})</h2>
            <div className="table-filters">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-control">
                <option value="date_desc">Latest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="priority_desc">High Priority First</option>
                <option value="priority_asc">Low Priority First</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-control">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reporter</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map(issue => (
                  <tr key={issue._id}>
                    <td>
                      <strong>{issue.title}</strong><br/>
                      <small>{issue.description.substring(0, 100)}...</small>
                    </td>
                    <td>
                      <span className={`badge badge-${issue.category}`}>
                        {issue.category}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{background: '#f1c40f'}}>
                        {issue.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${issue.status}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td>{issue.reportedBy?.name || 'Anonymous'}</td>
                    <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/issue/${issue._id}`} className="btn btn-sm">
                        <i className="fas fa-eye"></i> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

---

## ISSUES MAP IMPLEMENTATION

### `frontend/src/pages/IssuesMap.jsx`

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './IssuesMap.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons by status
const getMarkerIcon = (status, category) => {
  const colors = {
    pending: '#f39c12',
    'in-progress': '#3498db',
    resolved: '#27ae60',
    rejected: '#e74c3c',
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${colors[status] || '#95a5a6'}; 
                       width: 30px; height: 30px; border-radius: 50%; 
                       border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                       display: flex; align-items: center; justify-content: center;
                       font-size: 16px; color: white;">
             📍
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const IssuesMap = () => {
  const { user } = useAuthStore();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
  });

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, issues]);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/api/issues');
      const issuesWithCoords = response.data.data.filter(
        issue => issue.location && issue.location.coordinates
      );
      setIssues(issuesWithCoords);
      setFilteredIssues(issuesWithCoords);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
    }
  };

  const applyFilters = () => {
    let filtered = [...issues];

    if (filters.category) {
      filtered = filtered.filter(issue => issue.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(issue => issue.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(issue => issue.priority === filters.priority);
    }

    setFilteredIssues(filtered);
  };

  const clearFilters = () => {
    setFilters({ category: '', status: '', priority: '' });
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  // Calculate center point
  const centerLat = filteredIssues.length > 0 
    ? filteredIssues.reduce((sum, issue) => sum + issue.location.coordinates[1], 0) / filteredIssues.length
    : 40.7128;
  const centerLng = filteredIssues.length > 0
    ? filteredIssues.reduce((sum, issue) => sum + issue.location.coordinates[0], 0) / filteredIssues.length
    : -74.0060;

  return (
    <div className="map-page-container">
      <div className="container">
        <div className="map-page-header">
          <div>
            <h1><i className="fas fa-map-marked-alt"></i> Issues Map</h1>
            <p>View all reported issues across the city</p>
          </div>
          <Link to="/" className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i> Back to Home
          </Link>
        </div>

        {/* Map Statistics */}
        <div className="map-stats">
          <div className="stat-card-mini">
            <div className="stat-number">{filteredIssues.length}</div>
            <div className="stat-label">Total Issues</div>
          </div>
          <div className="stat-card-mini" style={{background: '#f39c12'}}>
            <div className="stat-number">{filteredIssues.filter(i => i.status === 'pending').length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card-mini" style={{background: '#3498db'}}>
            <div className="stat-number">{filteredIssues.filter(i => i.status === 'in-progress').length}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card-mini" style={{background: '#27ae60'}}>
            <div className="stat-number">{filteredIssues.filter(i => i.status === 'resolved').length}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="map-filters">
          <h3><i className="fas fa-filter"></i> Filter Issues</h3>
          <div className="filters-grid">
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="road">🛣️ Road</option>
                <option value="electricity">⚡ Electricity</option>
                <option value="water">💧 Water</option>
                <option value="sanitation">🗑️ Sanitation</option>
                <option value="transport">🚌 Transport</option>
                <option value="infrastructure">🏗️ Infrastructure</option>
                <option value="environment">🌳 Environment</option>
                <option value="others">📋 Others</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="resolved">✅ Resolved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                className="form-control"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group" style={{display: 'flex', alignItems: 'end'}}>
              <button onClick={clearFilters} className="btn btn-secondary" style={{width: '100%'}}>
                <i className="fas fa-times"></i> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="map-card">
          <h3>
            <i className="fas fa-map"></i> Interactive Map
            <span style={{fontSize: '0.8rem', color: 'var(--gray)', fontWeight: 'normal'}}>
              {' '}Showing {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
            </span>
          </h3>
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={12}
            style={{ height: '600px', width: '100%', borderRadius: '10px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {filteredIssues.map(issue => (
              <Marker
                key={issue._id}
                position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                icon={getMarkerIcon(issue.status, issue.category)}
              >
                <Popup>
                  <div className="map-popup">
                    <h4>{issue.title}</h4>
                    <p><strong>Category:</strong> {issue.category}</p>
                    <p><strong>Status:</strong> {issue.status}</p>
                    <p><strong>Priority:</strong> {issue.priority}</p>
                    <p>{issue.description.substring(0, 100)}...</p>
                    <Link to={`/issue/${issue._id}`} className="btn btn-sm btn-primary">
                      View Details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default IssuesMap;
```

---

## FINAL STEPS

### 1. Update `backend/server.js` - Add all routes

```javascript
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';

// Add after other routes
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
```

### 2. Update Home Page - Add Upvote Function

In `frontend/src/pages/Home.jsx`, add:

```jsx
const handleUpvote = async (issueId) => {
  if (!user) {
    toast.error('Please login to upvote');
    return;
  }

  try {
    await api.post(`/api/issues/${issueId}/upvote`);
    toast.success('Issue upvoted!');
    fetchIssues(); // Refresh list
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to upvote');
  }
};

// In JSX, update upvote button:
<button className="upvote-btn" onClick={() => handleUpvote(issue._id)}>
  <i className="fas fa-thumbs-up"></i>
  <span>{issue.upvotes}</span>
</button>
```

### 3. Update App.jsx - Add new routes

```jsx
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import IssuesMap from './pages/IssuesMap';

// Add routes:
<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="/map" element={<IssuesMap />} />
```

### 4. Create AdminRoute component in App.jsx

```jsx
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!user || !['super_admin', 'org_admin', 'org_staff'].includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};
```

---

## QUICK INSTALLATION CHECKLIST

1. ✅ Backend: Add upvotedBy and upvotes fields to Issue model
2. ✅ Backend: Add upvote route to issues.js
3. ✅ Backend: Create profile.js routes
4. ✅ Backend: Update admin.js routes
5. ✅ Backend: Register routes in server.js
6. ✅ Frontend: Update IssueDetail.jsx (complete replacement)
7. ✅ Frontend: Update Profile.jsx (complete replacement)
8. ✅ Frontend: Update AdminDashboard.jsx
9. ✅ Frontend: Update IssuesMap.jsx
10. ✅ Frontend: Add all CSS files
11. ✅ Frontend: Update App.jsx with new routes
12. ✅ Frontend: Add upvote function to Home.jsx

---

## TESTING

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Test:
1. Login as admin
2. View issue detail
3. Add comments
4. Upvote issues
5. Update issue status (admin)
6. Edit profile
7. Change password
8. View map
9. View admin dashboard

---

All files are ready! Copy the code from these guides into your project files.

