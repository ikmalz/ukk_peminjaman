import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();   

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.includes('petugas') && user.role === 'admin') {
    return children;   
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'petugas') return <Navigate to="/petugas" replace />;
    if (user.role === 'peminjam') return <Navigate to="/peminjam" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}