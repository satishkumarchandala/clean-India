import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            🏙 Urban Issue Reporter
          </Link>
          
          <div className="navbar-menu">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/demo" className="nav-link">Demo</Link>
            {['super_admin', 'org_admin', 'org_staff'].includes(user?.role) && (
              <Link to="/issues-map" className="nav-link">Map</Link>
            )}
            {isAuthenticated && (
              <>
                <Link to="/report-issue" className="nav-link">Report Issue</Link>
                {['super_admin', 'org_admin', 'org_staff'].includes(user?.role) && (
                  <Link to="/admin" className="nav-link">Admin</Link>
                )}
              </>
            )}
          </div>

          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="nav-link">
                  👤 {user?.name}
                </Link>
                <button onClick={handleLogout} className="btn btn-outline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
