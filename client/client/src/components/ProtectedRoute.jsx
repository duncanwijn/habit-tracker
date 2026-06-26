// src/components/ProtectedRoute.jsx
import { useAuth } from '../context/AuthContext';

// This component uses 'children' to wrap around private pages
export function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <h2>Access Denied. Please log in first.</h2>;
    // Or redirect using your router: return <Navigate to="/login" />
  }

  return children; // If logged in, show the private page normally
}