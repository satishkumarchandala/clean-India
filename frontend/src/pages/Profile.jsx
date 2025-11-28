import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './Profile.css';

const Profile = () => {
  const { user, setUser } = useAuthStore();

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    profilePicture: null,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [userIssues, setUserIssues] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUserIssues();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/profile');
      const userData = response.data.data;
      setProfile({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        profilePicture: null,
      });

      if (userData.profilePicture) {
        setImagePreview(`/api/uploads/${userData.profilePicture}`);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const fetchUserIssues = async () => {
    try {
      const response = await api.get('/api/profile/issues');
      setUserIssues(response.data.data);
    } catch (error) {
      console.error('Error fetching user issues:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setProfile({ ...profile, profilePicture: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('phone', profile.phone);
      formData.append('address', profile.address);

      if (profile.profilePicture) {
        formData.append('profilePicture', profile.profilePicture);
      }

      const response = await api.put('/api/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Profile updated successfully');
      setUser(response.data.data);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);

    try {
      await api.put('/api/profile/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      toast.success('Password changed successfully');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="container">
        <h1 className="profile-title">👤 My Profile</h1>

        <div className="profile-grid">
          <div className="profile-card">
            <h2>📝 Profile Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="profile-picture-section">
                <div className="profile-picture">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" />
                  ) : (
                    <i className="fas fa-user-circle"></i>
                  )}
                </div>
                <label className="upload-btn">
                  <i className="fas fa-camera"></i> Change Photo
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  <i className="fas fa-user"></i> Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i> Email
                </label>
                <input type="email" id="email" className="form-control" value={user?.email} disabled />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <i className="fas fa-phone"></i> Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="form-control"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">
                  <i className="fas fa-map-marker-alt"></i> Address
                </label>
                <textarea
                  id="address"
                  className="form-control"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  rows={3}
                  placeholder="Enter your address"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? '⏳ Updating...' : '✅ Update Profile'}
              </button>
            </form>
          </div>

          <div className="profile-card">
            <h2>🔐 Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">
                  <i className="fas fa-lock"></i> Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  className="form-control"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">
                  <i className="fas fa-key"></i> New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <i className="fas fa-check-circle"></i> Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-control"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-warning" disabled={changingPassword}>
                {changingPassword ? '⏳ Changing...' : '🔐 Change Password'}
              </button>
            </form>

            <div className="profile-stats">
              <h3>📊 Account Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <i className="fas fa-clipboard-list"></i>
                  <div>
                    <div className="stat-value">{userIssues.length}</div>
                    <div className="stat-label">Total Issues</div>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-clock"></i>
                  <div>
                    <div className="stat-value">
                      {userIssues.filter((issue) => issue.status === 'pending').length}
                    </div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <div className="stat-value">
                      {userIssues.filter((issue) => issue.status === 'resolved').length}
                    </div>
                    <div className="stat-label">Resolved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card" style={{ marginTop: '30px' }}>
          <h2>📋 My Reported Issues</h2>
          {userIssues.length === 0 ? (
            <div className="no-issues">
              <p>You haven't reported any issues yet.</p>
              <Link to="/report-issue" className="btn btn-primary">
                <i className="fas fa-plus"></i> Report an Issue
              </Link>
            </div>
          ) : (
            <div className="issues-table-container">
              <table className="issues-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Upvotes</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userIssues.map((issue) => (
                    <tr key={issue._id}>
                      <td>{issue.title}</td>
                      <td>
                        <span className={`badge badge-${issue.category}`}>{issue.category}</span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(issue.status) }}
                        >
                          {issue.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="upvotes">
                          <i className="fas fa-thumbs-up"></i> {issue.upvotes}
                        </span>
                      </td>
                      <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/issues/${issue._id}`} className="btn btn-sm btn-primary">
                          View
                        </Link>
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

export default Profile;
