import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import PriorityBreakdown from '../components/PriorityBreakdown';
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

          <PriorityBreakdown issue={issue} />

          <div className="map-container">
            <MapContainer
              center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
              zoom={17}
              style={{ height: '400px', width: '100%', borderRadius: '10px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
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
