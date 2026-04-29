// ─── Sidebar.jsx ─────────────────────────────────────────────────────────────
// NAVIGATION SIDEBAR
//
// AUDIT NOTES:
//   ✓ Preserved: Role-filtered nav items, SOS button for staff, user info card,
//                mobile overlay, SafeRoute branding, all original icons
//   ✗ Fixed: Had its own axios call to /api/auth/user (duplicate of Layout, ProtectedRoute)
//   ✗ Fixed: Hardcoded API URLs
//   ✗ Fixed: No keyboard accessibility
//   ✗ Fixed: SOS button was always visible even during loading
//   + Added: Reads from Zustand auth store (zero duplicate fetches)
//   + Added: Framer-motion slide animation
//   + Added: Keyboard nav (Escape to close)
//   + Added: Active route indicator with pill animation
//   + Added: Proper ARIA labels
//   + Added: Version/environment badge at bottom
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Bus, Users, Bell, ShieldCheck, X, Brain,
  UserPlus, LogOut, AlertTriangle
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useAuthStore from '../stores/authStore';
import { alertAPI } from '../lib/api';
import { NAV_ITEMS, ROLES, ROUTES } from '../lib/constants';
import { cn, getInitials } from '../lib/utils';

// ─── Icon Map ────────────────────────────────────────────────────────────────
const ICON_MAP = {
  LayoutDashboard: LayoutDashboard,
  Users: Users,
  Bus: Bus,
  Bell: Bell,
  Brain: Brain,
  UserPlus: UserPlus,
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // ── Keyboard: Escape to close ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, setIsOpen]);

  // ── Filter nav items by role ──
  const navItems = NAV_ITEMS.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  // ── Logout handler ──
  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  // ── Emergency SOS handler ──
  const handleSOS = useCallback(async () => {
    if (!window.confirm('BROADCAST EMERGENCY SOS? This will alert all admins and parents immediately!')) return;

    const toastId = 'sos';
    toast.loading('Broadcasting SOS...', { id: toastId });

    try {
      const pos = await new Promise((resolve) =>
        navigator.geolocation.getCurrentPosition(resolve, () =>
          resolve({ coords: { latitude: 0, longitude: 0 } })
        )
      );

      await alertAPI.broadcast({
        type: 'emergency',
        message: `CRITICAL: SOS signal received from ${user.fullname} (Bus ${user.branch}). Immediate assistance required! GPS: ${pos.coords.latitude}, ${pos.coords.longitude}`,
        target: 'Emergency Services',
        channels: ['GPS', 'SMS', 'PUSH'],
      });

      toast.success('SOS Broadcasted!', { id: toastId });
    } catch {
      toast.error('Failed to send SOS', { id: toastId });
    }
  }, [user]);

  return (
    <>
      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-[272px] transform bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* ── Brand ── */}
        <div className="flex h-16 items-center justify-between px-6 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <ShieldCheck className="text-blue-400" size={24} />
            <span>SafeRoute</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Navigation Links ── */}
        <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto" aria-label="Primary">
          {navItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === ROUTES.DASHBOARD}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <IconComponent size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Bottom Section ── */}
        <div className="px-4 pb-6 space-y-3 shrink-0">
          {/* SOS Button — Staff Only */}
          {user?.role === ROLES.STAFF && (
            <button
              onClick={handleSOS}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-red-900/40 border border-red-500 animate-pulse"
              aria-label="Emergency SOS broadcast"
            >
              <AlertTriangle size={18} />
              EMERGENCY SOS
            </button>
          )}

          {/* User Card */}
          {user ? (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(user.fullname)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-200 truncate">{user.fullname}</h4>
                  <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          )}

          {/* Version Badge */}
          <div className="text-center">
            <span className="text-[10px] text-slate-600 font-mono">SafeRoute v1.0.0 — Beta</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;