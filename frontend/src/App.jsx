import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Import pages
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import IssuesMap from './pages/IssuesMap';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Demo from './pages/Demo';
import OrganizationManagement from './pages/OrganizationManagement';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !['super_admin', 'org_admin', 'org_staff'].includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="demo" element={<Demo />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route
          path="report-issue"
          element={
            <ProtectedRoute>
              <ReportIssue />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="issues-map"
          element={
            <ProtectedRoute adminOnly={true}>
              <IssuesMap />
            </ProtectedRoute>
          }
        />
        <Route path="issues/:id" element={<IssueDetail />} />
        
        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/organizations"
          element={
            <ProtectedRoute adminOnly={true}>
              <OrganizationManagement />
            </ProtectedRoute>
          }
        />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
