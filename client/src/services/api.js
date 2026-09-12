import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
// Use adminToken for /admin routes, ownerToken for /owner routes
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  const ownerToken = localStorage.getItem('ownerToken');
  const path = window.location.pathname;
  
  // Determine which token to use based on current route
  let token;
  if (path.startsWith('/owner')) {
    token = ownerToken;
  } else if (path.startsWith('/admin')) {
    token = adminToken;
  } else {
    // For public routes, prefer admin token if available
    token = adminToken || ownerToken;
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('ownerToken');
      localStorage.removeItem('ownerUser');
      const path = window.location.pathname;
      if ((path.startsWith('/admin') || path.startsWith('/owner')) && path !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════
// Auth API
// ═══════════════════════════════════════════════════════════
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  ownerLogin: (credentials) => api.post('/auth/owner-login', credentials),
  staffLogin: (credentials) => api.post('/auth/staff-login', credentials),
  verify: () => api.get('/auth/verify'),
  getOwnerBeaches: () => api.get('/auth/owner-beaches')
};

// ═══════════════════════════════════════════════════════════
// Beaches API
// ═══════════════════════════════════════════════════════════
export const beachesAPI = {
  getAll: (params) => api.get('/beaches', { params }),
  getFeatured: () => api.get('/beaches/featured'),
  getStats: () => api.get('/beaches/stats'),
  getById: (id) => api.get(`/beaches/${id}`),
  create: (data) => api.post('/beaches', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/beaches/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/beaches/${id}`)
};

// ═══════════════════════════════════════════════════════════
// Reviews API
// ═══════════════════════════════════════════════════════════
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getByBeach: (beachId) => api.get(`/reviews/beach/${beachId}`),
  getRecent: (limit = 5) => api.get('/reviews/recent', { params: { limit } }),
  create: (data) => api.post('/reviews', data),
  delete: (id) => api.delete(`/reviews/${id}`)
};

// ═══════════════════════════════════════════════════════════
// Bookings API
// ═══════════════════════════════════════════════════════════
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getStats: () => api.get('/bookings/stats'),
  getRecent: (limit = 5) => api.get('/bookings/recent', { params: { limit } }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  delete: (id) => api.delete(`/bookings/${id}`),
  sendEmail: (id, data) => api.post(`/bookings/${id}/email`, data)
};

// ═══════════════════════════════════════════════════════════
// Properties API (Cottages & Rooms)
// ═══════════════════════════════════════════════════════════
export const propertiesAPI = {
  // Public: get all available cottages/rooms for a beach
  getByBeach: (type, beachId) => api.get(`/properties/${type}/beach/${beachId}`),
  // Public: get single cottage/room
  getById: (type, id) => api.get(`/properties/${type}/${id}`),
  // Admin/Owner: get all cottages/rooms for management (includes unavailable)
  getForManage: (type, beachId) => api.get(`/properties/${type}/manage/${beachId}`),
  // Admin/Owner: create cottage/room with images
  create: (type, data) => api.post(`/properties/${type}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Admin/Owner: update cottage/room
  update: (type, id, data) => api.put(`/properties/${type}/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Admin/Owner: delete cottage/room
  delete: (type, id) => api.delete(`/properties/${type}/${id}`),
  // Admin/Owner: delete single image
  deleteImage: (type, id, imageId) => api.delete(`/properties/${type}/${id}/images/${imageId}`)
};

// ═══════════════════════════════════════════════════════════
// Bookmarks API
// ═══════════════════════════════════════════════════════════
export const bookmarksAPI = {
  getAll: (sessionId) => api.get('/bookmarks', { params: { session_id: sessionId } }),
  check: (beachId, sessionId) => api.get(`/bookmarks/check/${beachId}`, { params: { session_id: sessionId } }),
  toggle: (beachId, sessionId) => api.post('/bookmarks/toggle', { beach_id: beachId, session_id: sessionId }),
  remove: (beachId, sessionId) => api.delete(`/bookmarks/${beachId}`, { params: { session_id: sessionId } })
};

// ═══════════════════════════════════════════════════════════
// Admins API
// ═══════════════════════════════════════════════════════════
export const adminsAPI = {
  getAll: () => api.get('/admins'),
  getById: (id) => api.get(`/admins/${id}`),
  create: (data) => api.post('/admins', data),
  update: (id, data) => api.put(`/admins/${id}`, data),
  delete: (id) => api.delete(`/admins/${id}`)
};

// ═══════════════════════════════════════════════════════════
// Dashboard API
// ═══════════════════════════════════════════════════════════
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentBeaches: () => api.get('/dashboard/recent-beaches'),
  getRecentReviews: () => api.get('/dashboard/recent-reviews'),
  getRecentBookings: () => api.get('/dashboard/recent-bookings'),
  getBookingTrend: () => api.get('/dashboard/booking-trend'),
  getActivity: () => api.get('/dashboard/activity')
};

// ═══════════════════════════════════════════════════════════
// Reports API
// ═══════════════════════════════════════════════════════════
export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getBookings: (params) => api.get('/reports/bookings', { params }),
  getBeaches: (params) => api.get('/reports/beaches', { params }),
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getReviews: (params) => api.get('/reports/reviews', { params })
};

// ═══════════════════════════════════════════════════════════
// Beach Owner API
// ═══════════════════════════════════════════════════════════
export const ownerAPI = {
  getDashboard: () => api.get('/owner/dashboard'),
  getBeach: () => api.get('/owner/beach'),
  updateBeach: (data) => api.put('/owner/beach', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getBookings: (params) => api.get('/owner/bookings', { params }),
  updateBookingStatus: (id, status) => api.put(`/owner/bookings/${id}/status`, { status }),
  sendBookingEmail: (id, data) => api.post(`/owner/bookings/${id}/email`, data),
  deleteBooking: (id) => api.delete(`/owner/bookings/${id}`),
  getReviews: () => api.get('/owner/reviews'),
  deleteReview: (id) => api.delete(`/owner/reviews/${id}`),
  getRecentBookings: () => api.get('/owner/recent-bookings'),
  getBookingTrend: () => api.get('/owner/booking-trend'),
  // Reports
  getReportSummary: (params) => api.get('/owner/reports/summary', { params }),
  getReportBookings: (params) => api.get('/owner/reports/bookings', { params }),
  getReportMonthly: (params) => api.get('/owner/reports/monthly', { params }),
  getReportReviews: (params) => api.get('/owner/reports/reviews', { params }),
  // Admin Accounts (sub-admins for beach)
  getAdmins: () => api.get('/owner/admins'),
  createAdmin: (data) => api.post('/owner/admins', data),
  updateAdmin: (id, data) => api.put(`/owner/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/owner/admins/${id}`)
};

export default api;
