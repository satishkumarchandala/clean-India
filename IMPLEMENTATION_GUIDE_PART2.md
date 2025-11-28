# IMPLEMENTATION GUIDE - PART 2
## Profile, Admin Dashboard, and Map Features

---

## PROFILE PAGE IMPLEMENTATION

### `frontend/src/pages/Profile.jsx`

**REPLACE ENTIRE FILE:**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './Profile.css';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  
  const [profile, setProfile] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    location: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/profile');
      setProfile(response.data.data.user);
      setStatistics(response.data.data.statistics);
      
      setFormData({
        name: response.data.data.user.name || '',
        phone: response.data.data.user.phone || '',
        bio: response.data.data.user.bio || '',
        location: response.data.data.user.location || '',
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Image size should be less than 16MB');
        return;
      }
      
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('phone', formData.phone);
      submitData.append('bio', formData.bio);
      submitData.append('location', formData.location);
      
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }

      const response = await api.put('/api/profile', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfile(response.data.data);
      setUser(response.data.data); // Update auth store
      toast.success('Profile updated successfully!');
      setEditMode(false);
      setProfilePicture(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await api.put('/api/profile/password', passwordData);
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return <div className="container"><h2>Profile not found</h2></div>;
  }

  return (
    <div className="profile-container">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="profile-image" />
            ) : profile.profilePicture ? (
              <img src={`/api/uploads/${profile.profilePicture}`} alt="Profile" className="profile-image" />
            ) : (
              <div className="default-avatar">
                <i className="fas fa-user"></i>
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <h1>{profile.name}</h1>
            <p className="profile-email"><i className="fas fa-envelope"></i> {profile.email}</p>
            {profile.location && <p className="profile-location"><i className="fas fa-map-marker-alt"></i> {profile.location}</p>}
            <p className="profile-role">
              <i className="fas fa-user-tag"></i> 
              {profile.role === 'super_admin' ? ' Super Admin' :
               profile.role === 'org_admin' ? ' Organization Admin' :
               profile.role === 'org_staff' ? ' Organization Staff' :
               ' Citizen'}
            </p>
            {profile.createdAt && (
              <p className="profile-joined">
                <i className="fas fa-calendar-alt"></i> Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {!editMode && (
            <div className="profile-actions">
              <button onClick={() => setEditMode(true)} className="btn btn-primary">
                <i className="fas fa-edit"></i> Edit Profile
              </button>
              <button onClick={() => setShowPasswordModal(true)} className="btn btn-secondary">
                <i className="fas fa-key"></i> Change Password
              </button>
            </div>
          )}
        </div>

        {editMode ? (
          <div className="profile-edit-card">
            <h2><i className="fas fa-edit"></i> Edit Profile</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="profilePicture">Profile Picture</label>
                <input
                  type="file"
                  id="profilePicture"
                  className="form-control"
                  onChange={handleImageChange}
                  accept="image/png,image/jpg,image/jpeg,image/gif"
                />
                <small>Max size: 16MB</small>
              </div>

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="form-control"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditMode(false);
                    setProfilePicture(null);
                    setPreviewUrl(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="profile-content">
              <div className="profile-section">
                <h3><i className="fas fa-info-circle"></i> About</h3>
                {profile.bio ? (
                  <p className="profile-bio">{profile.bio}</p>
                ) : (
                  <p className="profile-bio-empty">No bio provided yet.</p>
                )}
              </div>

              {profile.phone && (
                <div className="profile-section">
                  <h3><i className="fas fa-phone"></i> Contact Information</h3>
                  <p><i className="fas fa-mobile-alt"></i> {profile.phone}</p>
                </div>
              )}

              <div className="profile-section">
                <h3><i className="fas fa-chart-bar"></i> Activity</h3>
                <div className="activity-stats">
                  <div className="stat-item">
                    <span className="stat-number">{statistics?.issuesCount || 0}</span>
                    <span className="stat-label">Issues Reported</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{statistics?.commentsCount || 0}</span>
                    <span className="stat-label">Comments Posted</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  className="form-control"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
```

### `frontend/src/pages/Profile.css`

```css
.profile-container {
  min-height: 100vh;
  background: var(--light);
  padding: 40px 0;
}

.profile-header {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
  margin-bottom: 30px;
  display: flex;
  gap: 30px;
  align-items: center;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--primary);
}

.default-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: white;
}

.profile-info {
  flex-grow: 1;
}

.profile-info h1 {
  font-size: 32px;
  color: var(--dark);
  margin-bottom: 10px;
}

.profile-info p {
  margin: 5px 0;
  color: var(--gray);
  font-size: 16px;
}

.profile-info i {
  margin-right: 8px;
  color: var(--primary);
}

.profile-email {
  font-weight: 600;
  color: var(--dark) !important;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profile-edit-card,
.profile-content {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
  margin-bottom: 30px;
}

.profile-edit-card h2 {
  margin-bottom: 30px;
  color: var(--dark);
}

.profile-section {
  padding: 25px 0;
  border-bottom: 1px solid var(--gray-light);
}

.profile-section:last-child {
  border-bottom: none;
}

.profile-section h3 {
  font-size: 20px;
  color: var(--dark);
  margin-bottom: 15px;
}

.profile-section h3 i {
  margin-right: 10px;
  color: var(--primary);
}

.profile-bio {
  line-height: 1.8;
  color: var(--dark);
}

.profile-bio-empty {
  color: var(--gray);
  font-style: italic;
}

.activity-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 25px;
  background: var(--light);
  border-radius: 12px;
}

.stat-number {
  display: block;
  font-size: 36px;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 10px;
}

.stat-label {
  display: block;
  color: var(--gray);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-actions {
    width: 100%;
  }

  .profile-edit-card,
  .profile-content {
    padding: 20px;
  }

  .activity-stats {
    grid-template-columns: 1fr;
  }
}
```

---

## Continue with Admin Dashboard and Issues Map in next file...

