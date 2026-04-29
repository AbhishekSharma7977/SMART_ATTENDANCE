// ─── ProtectedRoute.jsx ──────────────────────────────────────────────────────
// ROUTE GUARD COMPONENT
//
// AUDIT NOTES:
//   ✓ Preserved: Role-based filtering, redirect to login, redirect to "/" on forbidden
//   ✗ Fixed: Had its own axios call to /api/auth/user (3rd duplicate across the app!)
//   ✗ Fixed: Loading spinner was a full-screen takeover even for nested routes
//   + Changed: Now reads from Zustand store — zero API calls, instant guard
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { ROUTES } from '../lib/constants';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Still resolving auth state — show minimal inline loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-[3px] border-slate-200" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Authenticated but wrong role → redirect to dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
};

export default ProtectedRoute;
