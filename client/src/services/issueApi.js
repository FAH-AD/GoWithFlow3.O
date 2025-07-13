import { get, post, put, deleteReq } from './ApiEndpoint.js';

// Issue APIs for users
export const issueApi = {
  // Create a new issue
  createIssue: (issueData) => post('/api/issues', issueData),
  
  // Get user's own issues
  getMyIssues: (params = {}) => get('/api/issues/my-issues', params),
  
  // Get issue by ID
  getIssueById: (id) => get(`/api/issues/${id}`),
  
  // Add response to an issue
  addResponse: (id, responseData) => post(`/api/issues/${id}/responses`, responseData),
  
  // Close issue
  closeIssue: (id) => put(`/api/issues/${id}/close`),
  
  // Update issue status (admin only)
  updateIssueStatus: (id, statusData) => put(`/api/issues/${id}/status`, statusData),
  
  // Assign issue (admin only)
  assignIssue: (id, assignData) => put(`/api/issues/${id}/assign`, assignData),
  
  // Update issue priority (admin only)
  updateIssuePriority: (id, priorityData) => put(`/api/issues/${id}/priority`, priorityData),
  
  // Get all issues (admin only)
  getAllIssues: (params = {}) => get('/api/issues/admin/all', params),
  
  // Get issue statistics (admin only)
  getIssueStats: () => get('/api/issues/admin/stats'),
};

export default issueApi;
