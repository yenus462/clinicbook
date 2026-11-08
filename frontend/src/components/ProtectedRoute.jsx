import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// Wraps a page. Usage:  <ProtectedRoute role="ADMIN"><AdminPage /></ProtectedRoute>
// - Not logged in: sent to /login (and brought back after login)
// - Wrong role: sent to the home page
// This only improves the experience. The backend is what really enforces access.
function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;