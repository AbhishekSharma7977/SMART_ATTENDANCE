// ─── SafeRoute API Abstraction Layer ─────────────────────────────────────────
// All HTTP calls go through this wrapper. No component should use raw axios/fetch.
import axios from 'axios';
import { API_BASE_URL } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Response Interceptor: Centralized error handling ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // Session expired or unauthorized — let the auth store handle redirect
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (data) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
  getUser: () => api.get('/api/auth/user'),
};

// ─── Students ────────────────────────────────────────
export const studentAPI = {
  getAll: (params) => api.get('/api/student', { params }),
};

// ─── Attendance ──────────────────────────────────────
export const attendanceAPI = {
  mark: (data) => api.post('/api/attendance', data),
  save: (data) => api.post('/api/attendance/save', data),
  getByStudent: (studentId) => api.get(`/api/attendance/${studentId}`),
};

// ─── Bus / Transport ─────────────────────────────────
export const busAPI = {
  getAll: () => api.get('/api/bus/all'),
  updateLocation: (coords) => api.post('/api/bus/update-location', coords),
};

// ─── Stats ───────────────────────────────────────────
export const statsAPI = {
  overview: () => api.get('/api/stats/dashboard'),
};

// ─── Alerts ──────────────────────────────────────────
export const alertAPI = {
  broadcast: (data) => api.post('/api/alerts', data),
  history: () => api.get('/api/alerts'),
};

// ─── AI Chatbot ──────────────────────────────────────
export const chatAPI = {
  createSession: () => api.post('/api/ai/session'),
  getSessions: () => api.get('/api/ai/session'),
  getSession: (id) => api.get(`/api/ai/session/${id}`),
  sendMessage: (data) => api.post('/api/ai/chat', data),
  getChats: (sessionId) => api.get(`/api/ai/chat/${sessionId}`),
};

export default api;
