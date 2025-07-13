import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  changeUserRole,
  sendUserWarning,
  deactivateUser,
  reactivateUser,
  handleReportedReview,
  createSystemNotification,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllJobs,
  getAllPayments,
  getAllClientVerificationRequests,
  handleClientVerification,
  getRecentUsers,
  getActivityLogs,
  getPlatformStatus,
  getIssueStatsForDashboard,
  getAllIssuesForAdmin,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import {isAdmin} from '../middleware/admin.js';


const router = express.Router();

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

//verify client
router.get('/verification-requests', protect, isAdmin, getAllClientVerificationRequests);
router.put('/verify-client/:userId', protect, isAdmin, handleClientVerification);
// Dashboard and statistics
router.get('/dashboard', getDashboardStats);
router.get('/recent-users', getRecentUsers);
router.get('/activity-logs', getActivityLogs);
router.get('/platform-status', getPlatformStatus);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/status', updateUserStatus);
router.put('/users/:userId/role', changeUserRole);
router.post('/users/:userId/warning', sendUserWarning);
router.put('/users/:userId/deactivate', deactivateUser);
router.put('/users/:userId/reactivate', reactivateUser);

// Review management
router.put('/reviews/:reviewId/report', handleReportedReview);

// Notification management
router.post('/notifications', createSystemNotification);

// Category management
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Job administration
router.get('/jobs', getAllJobs);

// Payment administration
router.get('/payments', getAllPayments);

// Issue management
router.get('/issues/stats', getIssueStatsForDashboard);
router.get('/issues', getAllIssuesForAdmin);

export default router;
