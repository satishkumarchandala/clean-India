import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './OrganizationManagement.css';

const OrganizationManagement = () => {
  const { user } = useAuthStore();
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const [orgForm, setOrgForm] = useState({
    name: '',
    category: '',
    description: '',
  });

  const [userAssignment, setUserAssignment] = useState({
    userId: '',
    organizationId: '',
    role: 'org_staff',
  });

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchOrganizations();
      fetchUsers();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/api/admin/organizations');
      setOrganizations(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();

    try {
      await api.post('/api/admin/organizations', orgForm);
      toast.success('Organization created successfully');
      setShowOrgModal(false);
      setOrgForm({ name: '', category: '', description: '' });
      fetchOrganizations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/api/admin/organizations/${selectedOrg._id}`, orgForm);
      toast.success('Organization updated successfully');
      setShowOrgModal(false);
      setSelectedOrg(null);
      setOrgForm({ name: '', category: '', description: '' });
      fetchOrganizations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update organization');
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/organizations/${orgId}`);
      toast.success('Organization deleted successfully');
      fetchOrganizations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  const handleAssignUser = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/api/admin/users/${userAssignment.userId}/organization`, {
        organizationId: userAssignment.organizationId,
        role: userAssignment.role,
      });
      toast.success('User assigned successfully');
      setShowUserModal(false);
      setUserAssignment({ userId: '', organizationId: '', role: 'org_staff' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign user');
    }
  };

  const openEditModal = (org) => {
    setSelectedOrg(org);
    setOrgForm({
      name: org.name,
      category: org.category,
      description: org.description || '',
    });
    setShowOrgModal(true);
  };

  const openCreateModal = () => {
    setSelectedOrg(null);
    setOrgForm({ name: '', category: '', description: '' });
    setShowOrgModal(true);
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Only Super Admins can access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading organizations...</p>
      </div>
    );
  }

  return (
    <div className="org-management-container">
      <div className="container">
        <div className="org-header">
          <h1>🏛️ Organization Management</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <i className="fas fa-plus"></i> Create Organization
            </button>
            <button className="btn btn-success" onClick={() => setShowUserModal(true)}>
              <i className="fas fa-user-plus"></i> Assign User
            </button>
          </div>
        </div>

        <div className="org-stats">
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-info">
              <div className="stat-value">{organizations.length}</div>
              <div className="stat-label">Organizations</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{users.filter(u => u.organization).length}</div>
              <div className="stat-label">Assigned Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <div className="stat-value">{users.filter(u => u.role !== 'user').length}</div>
              <div className="stat-label">Staff Members</div>
            </div>
          </div>
        </div>

        <div className="org-grid">
          {organizations.map((org) => (
            <div key={org._id} className="org-card">
              <div className="org-card-header">
                <h3>{org.name}</h3>
                <span className={`category-badge badge-${org.category}`}>
                  {org.category}
                </span>
              </div>
              
              {org.description && (
                <p className="org-description">{org.description}</p>
              )}

              <div className="org-stats-mini">
                <div className="mini-stat">
                  <i className="fas fa-users"></i>
                  <span>{users.filter(u => u.organization?._id === org._id).length} members</span>
                </div>
                <div className="mini-stat">
                  <i className="fas fa-clipboard-list"></i>
                  <span>{org.category} issues</span>
                </div>
              </div>

              <div className="org-members">
                <h4>Members:</h4>
                {users.filter(u => u.organization?._id === org._id).length === 0 ? (
                  <p className="no-members">No members assigned</p>
                ) : (
                  <ul className="member-list">
                    {users.filter(u => u.organization?._id === org._id).map(user => (
                      <li key={user._id}>
                        <span className="member-name">{user.name}</span>
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="org-actions">
                <button className="btn btn-sm btn-primary" onClick={() => openEditModal(org)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteOrg(org._id)}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {organizations.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-building"></i>
            <h2>No Organizations Yet</h2>
            <p>Create your first organization to get started</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <i className="fas fa-plus"></i> Create Organization
            </button>
          </div>
        )}
      </div>

      {/* Organization Modal */}
      {showOrgModal && (
        <div className="modal-overlay" onClick={() => setShowOrgModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedOrg ? 'Edit Organization' : 'Create Organization'}</h2>
            <form onSubmit={selectedOrg ? handleUpdateOrg : handleCreateOrg}>
              <div className="form-group">
                <label htmlFor="orgName">Organization Name</label>
                <input
                  type="text"
                  id="orgName"
                  className="form-control"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="orgCategory">Category</label>
                <select
                  id="orgCategory"
                  className="form-control"
                  value={orgForm.category}
                  onChange={(e) => setOrgForm({ ...orgForm, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="electricity">Electricity</option>
                  <option value="water">Water</option>
                  <option value="road">Road</option>
                  <option value="transport">Transport</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="others">Others</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="orgDescription">Description</label>
                <textarea
                  id="orgDescription"
                  className="form-control"
                  value={orgForm.description}
                  onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                  rows={4}
                  placeholder="Brief description of the organization..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrgModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedOrg ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign User to Organization</h2>
            <form onSubmit={handleAssignUser}>
              <div className="form-group">
                <label htmlFor="userId">Select User</label>
                <select
                  id="userId"
                  className="form-control"
                  value={userAssignment.userId}
                  onChange={(e) => setUserAssignment({ ...userAssignment, userId: e.target.value })}
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email}) - Current: {user.organization?.name || 'None'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="organizationId">Select Organization</label>
                <select
                  id="organizationId"
                  className="form-control"
                  value={userAssignment.organizationId}
                  onChange={(e) => setUserAssignment({ ...userAssignment, organizationId: e.target.value })}
                  required
                >
                  <option value="">Choose an organization...</option>
                  {organizations.map(org => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="userRole">Role</label>
                <select
                  id="userRole"
                  className="form-control"
                  value={userAssignment.role}
                  onChange={(e) => setUserAssignment({ ...userAssignment, role: e.target.value })}
                  required
                >
                  <option value="org_staff">Organization Staff</option>
                  <option value="org_admin">Organization Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
