import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('viewer' | 'vendor' | 'admin')[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, loading } = useSupabase();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'vendor') {
      return <Navigate to="/account" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  return <>{children}</>;
}

// Role-based redirect component
export function RoleBasedRedirect() {
  const { user, loading } = useSupabase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect based on user role
  if (user.role === 'vendor') {
    return <Navigate to="/account" replace />;
  } else {
    return <Navigate to="/home" replace />;
  }
}
