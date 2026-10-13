import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /session-expired (soft) or /login (hard).
 * Usage:
 *   <ProtectedRoute><MyPage /></ProtectedRoute>
 */
export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/session-expired"
        replace
        state={{ from: location }}
      />
    );
  }
  return children;
};

/**
 * RoleRoute
 * Redirects to /403 if the logged-in user does not have the required role.
 * Usage:
 *   <RoleRoute role="admin"><AdminDashboard /></RoleRoute>
 */
export const RoleRoute = ({ children, role }) => {
  const token = localStorage.getItem('access_token');
  const currentRole = localStorage.getItem('user_role');
  const location = useLocation();

  if (!token) {
    // Not logged in at all → session expired
    return <Navigate to="/session-expired" replace state={{ from: location }} />;
  }

  // Normalise: admins can access everything, owner can access owner-level routes
  const allowed =
    currentRole === role ||
    currentRole === 'admin'; // admin is a super-role

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

/**
 * GuestRoute
 * Redirects already-authenticated users to / (home).
 * Use for Login and Register pages.
 */
export const GuestRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};
