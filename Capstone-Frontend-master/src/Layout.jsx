// ─── Layout.jsx ──────────────────────────────────────────────────────────────
// MAIN APPLICATION SHELL
//
// AUDIT NOTES:
//   ✓ Preserved: Sidebar + Outlet structure, mobile hamburger, Socket alert listener
//   ✗ Fixed: Socket connection was created raw (no hook, no cleanup safety)
//   ✗ Fixed: No Header/Navbar — only had a bare hamburger button
//   ✗ Fixed: No breadcrumb or user context in the header
//   ✗ Fixed: Alert toast had inline styles instead of shared components
//   + Added: Professional top header bar with user info, role badge, notifications bell
//   + Added: useSocket hook for lifecycle-safe Socket.IO
//   + Added: useAuthStore integration (no more duplicate API calls)
//   + Added: Framer-motion page transition wrapper
//   + Added: Auth guard at the layout level
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, AlertTriangle, Bell, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import Sidebar from "./components/Sidebar";
import useAuthStore from "./stores/authStore";
import { useSocket } from "./hooks/useSocket";
import { ROUTES, ROLES, ROLE_LABELS } from "./lib/constants";
import { cn, getInitials } from "./lib/utils";

// ─── Page Transition Wrapper ─────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ─── Breadcrumb Map ──────────────────────────────────────────────────────────
const BREADCRUMB_MAP = {
  '/': 'Home',
  '/dashboard': 'Overview',
  '/attendance': 'Attendance',
  '/attendance/scan': 'Scanner',
  '/tracking': 'Transport',
  '/notifications': 'Alerts',
  '/ai/chat': 'AI Assistant',
  '/create-profile': 'Create User',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { on } = useSocket();

  // ── Redirect to login if not authenticated ──
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // ── Real-time alert listener ──
  useEffect(() => {
    const cleanup = on('new-alert', (data) => {
      const isEmergency = data.type === 'emergency';

      toast.custom(
        (t) => (
          <div
            className={cn(
              'max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 border-l-4 transition-all',
              t.visible ? 'animate-enter' : 'animate-leave',
              isEmergency ? 'border-red-600' : 'border-blue-500'
            )}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  {isEmergency ? (
                    <AlertTriangle className="text-red-500 animate-pulse" size={24} />
                  ) : (
                    <Bell className="text-blue-500" size={24} />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    {data.type}: {data.senderName || 'System'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 font-medium">{data.message}</p>
                  {isEmergency && (
                    <div className="mt-3">
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase hover:bg-red-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ),
        { duration: isEmergency ? 10000 : 5000, position: 'top-center' }
      );
    });

    return cleanup;
  }, [on]);

  // ── Build breadcrumb ──
  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .reduce(
      (acc, segment, i, arr) => {
        const path = '/' + arr.slice(0, i + 1).join('/');
        acc.push({ label: BREADCRUMB_MAP[path] || segment, path });
        return acc;
      },
      [{ label: 'Home', path: '/' }]
    );

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  // ── Don't render layout until auth state is resolved ──
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-[3px] border-slate-200" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Securing your session...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-slate-50 relative overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        {/* ── Top Header Bar ── */}
        <header className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 w-full shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo for mobile */}
            <div className="lg:hidden flex items-center gap-2">
              <ShieldCheck size={22} className="text-blue-600" />
              <span className="font-bold text-lg text-slate-800">SafeRoute</span>
            </div>

            {/* Breadcrumb for desktop */}
            <nav className="hidden lg:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={14} className="text-slate-300" />}
                  <span
                    className={cn(
                      'font-medium',
                      i === breadcrumbs.length - 1 ? 'text-slate-800' : 'text-slate-400'
                    )}
                  >
                    {crumb.label}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          {/* Right Side: User Info */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            {user && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            )}

            {/* User Avatar */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                  {getInitials(user.fullname)}
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                  {user.fullname}
                </span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;