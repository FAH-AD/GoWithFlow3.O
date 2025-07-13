import express from 'express';
import {
  createIssue,
  getMyIssues,
  getIssueById,
  addResponse,
  updateIssueStatus,
  assignIssue,
  getAllIssues,
  getIssueStats,
  updateIssuePriority,
  closeIssue,
} from '../controllers/issueController.js';
import { protect, authorize, isVerified } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// User routes - protected but not requiring email verification (support access)
router.post('/', protect, upload.array('attachments', 5), createIssue);
router.get('/my-issues', protect, getMyIssues);
router.get('/:id', protect, getIssueById);
router.post('/:id/responses', protect, upload.array('attachments', 3), addResponse);
router.put('/:id/close', protect, closeIssue);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllIssues);
router.get('/admin/stats', protect, authorize('admin'), getIssueStats);
router.put('/:id/status', protect, authorize('admin'), updateIssueStatus);
router.put('/:id/assign', protect, authorize('admin'), assignIssue);
router.put('/:id/priority', protect, authorize('admin'), updateIssuePriority);

export default router;
