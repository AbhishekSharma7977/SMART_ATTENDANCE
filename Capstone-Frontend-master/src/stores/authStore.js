// ─── Auth Store (Zustand) ────────────────────────────────────────────────────
// Single source of truth for authentication state across the entire application.
// Eliminates the N+1 API call problem where every component independently fetches the user.
import { create } from 'zustand';
import { authAPI } from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  /** Fetch current user from the cookie-based session */
  fetchUser: async () => {
    // Prevent duplicate fetches
    if (get().user && get().isAuthenticated) return get().user;

    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.getUser();
      if (response.data.success) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        return response.data.user;
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  /** Login — sets cookie via backend and then fetches user profile */
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      if (response.data.success) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }
      set({ isLoading: false, error: response.data.error || 'Login failed' });
      return { success: false, error: response.data.error };
    } catch (err) {
      const message = err.response?.data?.error || 'An error occurred during login';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /** Logout — clears cookie via backend */
  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Proceed with local cleanup even if API fails
    }
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  /** Clear any stored error */
  clearError: () => set({ error: null }),

  /** Force refresh user data */
  refreshUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authAPI.getUser();
      if (response.data.success) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;
