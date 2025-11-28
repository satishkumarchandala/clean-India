import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import './IssuesMap.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on status
const getMarkerIcon = (status) => {
  const colors = {
    pending: 'orange',
    'in-progress': 'blue',
    resolved: 'green',
    rejected: 'red',
  };

  const color = colors[status] || 'gray';

  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const IssuesMap = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([20.5937, 78.9629]); // Center of India
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [issues, filters]);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/api/issues');
      const issuesData = response.data.data;
      setIssues(issuesData);

      // Set map center to first issue's location if available
      if (issuesData.length > 0) {
        const firstIssue = issuesData[0];
        setCenter([
          firstIssue.location.coordinates[1],
          firstIssue.location.coordinates[0],
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...issues];

    if (filters.category !== 'all') {
      filtered = filtered.filter((issue) => issue.category === filters.category);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((issue) => issue.status === filters.status);
    }

    setFilteredIssues(filtered);
  };

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="map-page-container">
      <div className="map-header">
        <div className="container">
          <div className="header-content">
            <h1>🗺️ Issues Map</h1>
            <Link to="/" className="btn btn-secondary">
              <i className="fas fa-list"></i> List View
            </Link>
          </div>

          <div className="map-filters">
            <div className="filter-group">
              <label>
                <i className="fas fa-filter"></i> Category:
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="all">All Categories</option>
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

            <div className="filter-group">
              <label>
                <i className="fas fa-info-circle"></i> Status:
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="resolved">✅ Resolved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>

            <div className="map-stats">
              <span className="stat-badge">
                📍 {filteredIssues.length} Issues
              </span>
            </div>
          </div>

          <div className="map-legend">
            <span className="legend-item">
              <span className="legend-marker" style={{ background: 'orange' }}></span> Pending
            </span>
            <span className="legend-item">
              <span className="legend-marker" style={{ background: 'blue' }}></span> In Progress
            </span>
            <span className="legend-item">
              <span className="legend-marker" style={{ background: 'green' }}></span> Resolved
            </span>
            <span className="legend-item">
              <span className="legend-marker" style={{ background: 'red' }}></span> Rejected
            </span>
          </div>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          {filteredIssues.map((issue) => (
            <Marker
              key={issue._id}
              position={[
                issue.location.coordinates[1],
                issue.location.coordinates[0],
              ]}
              icon={getMarkerIcon(issue.status)}
            >
              <Popup>
                <div className="map-popup">
                  <h3>{issue.title}</h3>
                  <div className="popup-meta">
                    <span className={`badge badge-${issue.category}`}>
                      {categoryEmojis[issue.category]} {issue.category}
                    </span>
                    <span className={`badge badge-${issue.status}`}>
                      {statusEmojis[issue.status]} {issue.status}
                    </span>
                  </div>
                  <p className="popup-description">{issue.description.substring(0, 100)}...</p>
                  <div className="popup-info">
                    <span>
                      <i className="fas fa-thumbs-up"></i> {issue.upvotes} upvotes
                    </span>
                    <span>
                      <i className="fas fa-calendar"></i> {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="popup-btn"
                    onClick={() => navigate(`/issues/${issue._id}`)}
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {filteredIssues.length === 0 && (
        <div className="no-issues-overlay">
          <div className="no-issues-message">
            <i className="fas fa-map-marked-alt"></i>
            <h2>No Issues Found</h2>
            <p>Try adjusting your filters or report a new issue</p>
            <Link to="/report-issue" className="btn btn-primary">
              <i className="fas fa-plus"></i> Report Issue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuesMap;
