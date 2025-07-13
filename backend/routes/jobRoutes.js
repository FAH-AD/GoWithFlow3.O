import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyPostedJobs,
  hireFreelancer,
  completeJob,
  submitWorkForCompletion,
  cancelJob,
  getActiveAndCompletedJobs,

  enableCrowdsourcing,
  addTeamMember,
  removeTeamMember,
  addMilestone,
  approveMilestone,
  getAllClientJobs,
  getJobMilestones,
  getAllJobs,
  saveJob,
  unsaveJob,
  searchJobs,
  getClientCrowdsourcedJobs,
  getFreelancerCrowdsourcedJobs,
  requestRevision
  
} 
from '../controllers/jobController.js';
import { protect, authorize, isVerified } from '../middleware/auth.js';
import { isClient, isClientOrAdmin, isFreelancer } from '../middleware/admin.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', protect, getJobs);
router.get('/all-jobs', protect, getAllJobs);
router.get('/search',protect,isFreelancer, searchJobs);
router.get('/client/teams', protect, getClientCrowdsourcedJobs);
router.get('/freelancer/teams', protect, getFreelancerCrowdsourcedJobs);
router.get('/:id', getJobById);


// Protected routes
router.post('/', protect, isVerified, isClient, upload.array(5), createJob);
router.put('/:id', protect, isVerified, isClient, upload.array(5), updateJob);
router.delete('/:id', protect, isClientOrAdmin, deleteJob);


// Client routes
router.get('/my/posted-jobs', protect, isClient, getMyPostedJobs);
router.post('/:id/hire/:bidId', protect, isClient, hireFreelancer);
router.put('/:id/complete', protect, completeJob);
router.put('/:id/submit-work', protect, isFreelancer, submitWorkForCompletion);
router.put('/:id/cancel', protect, isClientOrAdmin, cancelJob);
router.get('/user/active-jobs', protect, getActiveAndCompletedJobs);
router.put('/:jobId/freelancer/:freelancerId/milestone/:milestoneId/approve', protect, isClient, approveMilestone);
router.post('/jobs/:id/milestones/:milestoneId/request-revision', protect,isClient, requestRevision);

// Freelancer routes
router.get('/freelancer/status', protect, getActiveAndCompletedJobs);

// Additional routes
router.put('/:id/enable-crowdsourcing', protect, enableCrowdsourcing);
router.post('/:id/team/:bidId', protect, addTeamMember);
router.delete('/:id/team/:memberId', protect, removeTeamMember);
router.post('/:id/milestones', protect, isClient, addMilestone);
router.post('/:id/team/:memberId/milestones', protect, addMilestone);

// New routes

router.put('/:id/milestones/:milestoneId/approve', protect, approveMilestone);
router.get('/:id/milestones', protect, getJobMilestones); // Added new route

// Route to get all jobs posted by all clients
router.get('/all', protect, getAllClientJobs);

// Save a job
router.post('/:id/save', protect, isVerified, saveJob);

// Unsave a job
router.delete('/:id/unsave', protect, isVerified, unsaveJob);

export default router;
