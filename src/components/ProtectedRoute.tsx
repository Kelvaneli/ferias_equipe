import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { User as FirebaseUser } from 'firebase/auth';

interface ProtectedRouteProps {
  user: FirebaseUser | null;
  isLoading: boolean;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, isLoading, children }) => {
  const location = useLocation();

  // Wait for Firebase to restore the session before deciding
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
