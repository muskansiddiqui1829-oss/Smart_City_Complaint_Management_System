import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};

// Complaint APIs
export const complaintAPI = {
  submit: (data) => api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getPublic: (params) => api.get('/complaints/public', { params }),
  getStats: () => api.get('/complaints/stats'),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  assign: (id, data) => api.put(`/complaints/${id}/assign`, data),
  upvote: (id) => api.put(`/complaints/${id}/upvote`),
  rate: (id, data) => api.put(`/complaints/${id}/rate`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
};

// Admin APIs
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllComplaints: (params) => api.get('/admin/complaints', { params }),
  sendBulkNotification: (data) => api.post('/admin/notifications/bulk', data),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get('/users/notifications', { params }),
  markRead: (ids) => api.put('/users/notifications/read', { ids }),
  delete: (id) => api.delete(`/users/notifications/${id}`),
};

export default api;
