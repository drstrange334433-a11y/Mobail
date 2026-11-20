import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from '../components/common/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // Prepared for future RBAC expansion
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, session, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Verifying administrative session..." />
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!session || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Verify membership in public.admins via public.is_admin() RPC
  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location, unauthorized: true }} replace />;
  }

  // Explicit role checking if a specific role is requested
  if (requiredRole) {
    const userRole = (user.app_metadata?.role as string) || (user.user_metadata?.role as string) || 'admin';
    if (userRole !== requiredRole && userRole !== 'super_admin') {
      return <Navigate to="/admin/login" state={{ from: location, unauthorized: true }} replace />;
    }
  }

  return <>{children}</>;
};
