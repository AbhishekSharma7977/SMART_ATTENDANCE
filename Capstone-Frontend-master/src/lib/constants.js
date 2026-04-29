// ─── SafeRoute Application Constants ─────────────────────────────────────────
// Centralized configuration to eliminate hardcoded values across the codebase.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  PARENT: 'parent',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.STAFF]: 'Staff / Driver',
  [ROLES.PARENT]: 'Parent / Guardian',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  ATTENDANCE: '/attendance',
  ATTENDANCE_SCAN: '/attendance/scan',
  TRACKING: '/tracking',
  NOTIFICATIONS: '/notifications',
  AI_CHAT: '/ai/chat',
  CREATE_PROFILE: '/create-profile',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
};

export const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'Overview', roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.PARENT], icon: 'LayoutDashboard' },
  { path: ROUTES.ATTENDANCE, label: 'Attendance', roles: [ROLES.ADMIN, ROLES.STAFF], icon: 'Users' },
  { path: ROUTES.TRACKING, label: 'Transport', roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.PARENT], icon: 'Bus' },
  { path: ROUTES.NOTIFICATIONS, label: 'Alerts', roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.PARENT], icon: 'Bell' },
  { path: ROUTES.AI_CHAT, label: 'AI Assistant', roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.PARENT], icon: 'Brain' },
  { path: ROUTES.CREATE_PROFILE, label: 'Create User', roles: [ROLES.ADMIN], icon: 'UserPlus' },
];

export const FACE_DETECTION_THRESHOLD = 0.6;

export const TOAST_CONFIG = {
  position: 'top-right',
  reverseOrder: false,
  toastOptions: {
    duration: 4000,
    style: {
      borderRadius: '12px',
      background: '#1e293b',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
    },
  },
};
