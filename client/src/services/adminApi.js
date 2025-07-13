import { get, post, put, deleteUser } from './ApiEndpoint.js';

// Admin Dashboard APIs
export const adminApi = {
  // Dashboard Stats
  getDashboardStats: () => get('/api/admin/dashboard'),
  
  // User Management
  getAllUsers: (params = {}) => get('/api/admin/users', params),
  getRecentUsers: (limit = 5) => get('/api/admin/recent-users', { limit }),
  updateUserStatus: (userId, status) => put(`/api/admin/users/${userId}/status`, { status }),
  changeUserRole: (userId, role) => put(`/api/admin/users/${userId}/role`, { role }),
  sendUserWarning: (userId, message) => post(`/api/admin/users/${userId}/warning`, { message }),
  deactivateUser: (userId) => put(`/api/admin/users/${userId}/deactivate`),
  reactivateUser: (userId) => put(`/api/admin/users/${userId}/reactivate`),
  
  // Activity Logs
  getActivityLogs: (params = {}) => get('/api/admin/activity-logs', params),
  
  // Platform Status
  getPlatformStatus: () => get('/api/admin/platform-status'),
  
  // Job Management
  getAllJobs: (params = {}) => get('/api/admin/jobs', params),
  
  // Payment Management
  getAllPayments: (params = {}) => get('/api/admin/payments', params),
  
  // Category Management
  createCategory: (categoryData) => post('/api/admin/categories', categoryData),
  updateCategory: (id, categoryData) => put(`/api/admin/categories/${id}`, categoryData),
  deleteCategory: (id) => deleteUser(`/api/admin/categories/${id}`),
  
  // Client Verification
  getVerificationRequests: (params = {}) => get('/api/admin/verification-requests', params),
  handleClientVerification: (userId, action) => put(`/api/admin/verify-client/${userId}`, { action }),
  
  // Notifications
  createSystemNotification: (notificationData) => post('/api/admin/notifications', notificationData),
  
  // Review Management
  handleReportedReview: (reviewId, action) => put(`/api/admin/reviews/${reviewId}/report`, { action }),
  
  // Issue Management
  getIssueStats: () => get('/api/admin/issues/stats'),
  getAllIssues: (params = {}) => get('/api/admin/issues', params),
};

export default adminApi;
