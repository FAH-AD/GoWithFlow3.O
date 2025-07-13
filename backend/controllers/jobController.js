import { sendEmail } from '../utils/sendEmail.js';
import Job from '../models/Job.js';
import ApiError from '../utils/ApiError.js';
import Bid from '../models/Bid.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { customErrorHandler,successResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { createMilestoneEscrowPayment } from '../controllers/paymentController.js';
import { getJobReviews } from './reviewController.js';


// Utility: send a unified response
const sendResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    status: statusCode < 400 ? 'success' : 'error',
    message,
    data,
  });
};

// 1. Create Job
export const createJob = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subCategory,
      skills,
      budget,
      deadline,
      duration,
      experienceLevel,
      location,
      attachments,
      isPromoted,
      isPublic,
      isCrowdsourced,
      crowdsourcingRoles,
      milestones
    } = req.body;

    const jobData = {
      title,
      description,
      client: req.user.id,
      subCategory,
      skills,
      budget,
      deadline,
      duration,
      experienceLevel,
      location,
      attachments,
      isPromoted: isPromoted || false,
      isPublic: isPublic !== undefined ? isPublic : true,
      isCrowdsourced: isCrowdsourced || false,
      crowdsourcingRoles: isCrowdsourced ? crowdsourcingRoles : [],
      milestones: milestones || []
    };

    const job = await Job.create(jobData);

    if (isCrowdsourced) {
      const conversation = new Conversation({
        participants: [req.user.id],
        job: job._id,
        isGroup: true,
        name: `Team for: ${job.title}`,
        admin: req.user.id
      });
      await conversation.save();
      
      job.groupConversation = conversation._id;
      await job.save();
    }

    sendResponse(res, httpStatus.CREATED, 'Job has been successfully posted.', job);
  } catch (error) {
    next(new ApiError(httpStatus.BAD_REQUEST, `Failed to post job: ${error.message}`));
  }
};

// 2. Get All Jobs
export const getJobs = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated.'));
    }

    const freelancer = await User.findById(req.user.id);
    if (!freelancer) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'Freelancer not found.'));
    }

    const freelancerSkills = (freelancer.skills || []).map(skill => skill.toLowerCase());

    const allJobs = await Job.find({ status: 'open' })
        .populate('client', 'name email profilePic companyName totalSpent')
        .sort({ createdAt: -1 });
  
      const jobsWithAppliedStatus = await Promise.all(allJobs
        .filter(job => job.client) // Filter out jobs where client doesn't exist
        .map(async (job) => {
          const jobObj = job.toObject();
          let jobSkills = [];
  
          if (job.isCrowdsourced) {
            jobSkills = [...new Set(
              jobObj.crowdsourcingRoles.flatMap(role => role.skills || [])
            )];
          } else {
            jobSkills = jobObj.skills || [];
          }
  
          jobSkills = jobSkills.map(skill => skill.toLowerCase());
  
          const matchingSkills = jobSkills.filter(skill => freelancerSkills.includes(skill));
  
          const matchPercentage = jobSkills.length > 0
            ? Math.round((matchingSkills.length / jobSkills.length) * 100)
            : 0;
  
          // Check if the freelancer has applied for this job
          const hasApplied = await Bid.exists({ job: job._id, freelancer: req.user.id });
  
          return {
            ...jobObj,
            client: {
              _id: jobObj.client._id,
              name: jobObj.client.name,
              email: jobObj.client.email,
              profileImage: jobObj.client.profilePic,
              companyName: jobObj.client.companyName,
              totalSpent: jobObj.client.totalSpent
            },
            skillMatchPercentage: matchPercentage,
            matchingSkills,
            hasApplied: !!hasApplied, // Convert to boolean
          };
        }));
  
      const matchingJobs = jobsWithAppliedStatus
        .filter(job => job.matchingSkills.length > 0)
        .sort((a, b) => b.skillMatchPercentage - a.skillMatchPercentage);
  
      sendResponse(res, httpStatus.OK, 'Jobs retrieved successfully.', matchingJobs);
  
    } catch (error) {
      console.error('Error in getJobs:', error);
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to fetch jobs.'));
    }
  };

export const getAllJobs = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated.'));
    }

    const freelancer = await User.findById(req.user.id);
    if (!freelancer) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'Freelancer not found.'));
    }

    // Fetch all open jobs without skill matching
    const allJobs = await Job.find({ status: 'open' })
      .populate('client', 'name email profilePic')
      .sort({ createdAt: -1 });

    sendResponse(res, httpStatus.OK, 'Jobs retrieved successfully.', allJobs);

  } catch (error) {
    console.error('Error in getJobs:', error);
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to fetch jobs.'));
  }
};




// 3. Get Single Job
export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      console.error('Job not found with ID:', req.params.id);
      return next(new ApiError(httpStatus.NOT_FOUND, 'Job not found.'));
    }

    sendResponse(res, httpStatus.OK, 'Job details retrieved successfully.', job);
  } catch (error) {
    console.error('Error in getJobById:', error.message); // log real error
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not retrieve job.'));
  }
};


export const searchJobs = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'freelancer') {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Only freelancers can search for jobs.'
      });
    }

    const {
      title, skills, budget, duration, experienceLevel, location,
      status, isPromoted, isPublic, isCrowdsourced, page = 1, limit = 10
    } = req.query;

    const query = {};

    if (title) query.$text = { $search: title };
    if (skills) query.skills = { $in: skills.split(',') };
    if (budget) {
      const [minBudget, maxBudget] = budget.split('-');
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }
    if (duration) query.duration = duration;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (location) query.location = location;
    if (status) query.status = status;
    if (isPromoted !== undefined) query.isPromoted = isPromoted === 'true';
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (isCrowdsourced !== undefined) query.isCrowdsourced = isCrowdsourced === 'true';

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: { path: 'client', select: 'name email profilePic' }
    };

    const jobs = await Job.paginate(query, options);

    const jobsWithAppliedStatus = await Promise.all(
      jobs.docs.map(async (job) => {
        const bid = await Bid.findOne({ job: job._id, freelancer: req.user._id }).lean();
        return {
          ...job.toObject(),
          hasApplied: !!bid
        };
      })
    );

    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Jobs retrieved successfully.',
      data: {
        jobs: jobsWithAppliedStatus,
        currentPage: jobs.page,
        totalPages: jobs.totalPages,
        totalJobs: jobs.totalDocs
      }
    });

  } catch (error) {
    console.error('Error in searchJobs:', error.message);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Unable to search jobs.'
    });
  }
};



// 4. Get Jobs by Client

export const getMyPostedJobs = async (req, res, next) => {
  try {
    const clientId = req.user._id;

    const jobs = await Job.find({ client: clientId });

    if (!jobs || jobs.length === 0) {
      return res.status(httpStatus.OK).json({
        status: 'success',
        message: 'You have not posted any jobs yet.',
        data: []
      });
    }

    res.status(httpStatus.OK).json({
      status: 'success',
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};


// 5. Get Jobs by Freelancer
export const getJobsByFreelancer = async (req, res, next) => {
  try {
    const jobs = await Job.find({ hiredFreelancer: req.user.id });
    sendResponse(res, httpStatus.OK, 'Jobs you were hired for retrieved.', jobs);
  } catch (error) {
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to fetch freelancer jobs.'));
  }
};

// 6. Update Job
export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, client: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) return next(new ApiError(httpStatus.NOT_FOUND, 'Job not found or unauthorized.'));
    sendResponse(res, httpStatus.OK, 'Job updated successfully.', job);
  } catch (error) {
    next(new ApiError(httpStatus.BAD_REQUEST, `Update failed: ${error.message}`));
  }
};

// 7. Delete Job
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, client: req.user.id });
    if (!job) return next(new ApiError(httpStatus.NOT_FOUND, 'No job found to delete.'));
    sendResponse(res, httpStatus.OK, 'Job removed successfully.', job);
  } catch (error) {
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not delete job.'));
  }
};

// 8. Hire Freelancer (Send Offer)
export const hireFreelancer = async (req, res) => {
  try {
    const { id, bidId } = req.params;
    const { milestoneTitle, milestoneDescription, milestoneAmount, milestoneDeadline } = req.body;

    if (!milestoneTitle || !milestoneDescription || !milestoneAmount || !milestoneDeadline) {
      return customErrorHandler(res, new Error('Missing required fields'), 400);
    }
    const job = await Job.findById(id);
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    if (job.client.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: You can only hire for your own jobs'), 403);
    }

    if (job.status !== 'open') {
      return customErrorHandler(res, new Error(`Cannot hire for job with status ${job.status}`), 400);
    }

    const bid = await Bid.findById(bidId);
    if (!bid) return customErrorHandler(res, new Error('Bid not found'), 404);
    if (bid.job.toString() !== job._id.toString()) {
      return customErrorHandler(res, new Error('Bid does not belong to this job'), 400);
    }

    // Create offer
    const offer = {
      freelancer: bid.freelancer,
      status: 'pending',
      milestoneTitle: milestoneTitle,
      milestoneDescription: milestoneDescription,
      milestoneAmount: milestoneAmount,
      milestoneDeadline: milestoneDeadline
    };

    console.log('Offer:', offer);

    job.offers = job.offers || [];
    job.offers.push(offer);
    await job.save();

    // Notify freelancer
    await Notification.create({
      recipient: bid.freelancer,
      type: 'job-updated',
      title: 'New Job Offer',
      message: `You've received an offer for the job "${job.title}". Please review and respond.`,
      data: {
        job: job._id,
        sender: req.user._id,
        bid: bid._id,
      },
    });

    // Send email notification
    const freelancer = await User.findById(bid.freelancer);
    await sendEmail({
      to:freelancer.email,
      subject:'New Job Offer',
      text:`You've received an offer for the job "${job.title}". Please log in to review and respond.`
  });

    return successResponse(res, 200, 'Job offer sent successfully');
  } catch (error) {
    return customErrorHandler(res, error);
  }
};



export const addTeamMember = async (req, res) => {
  try {
    const { id, bidId } = req.params;
    const { roleTitle, milestoneTitle, milestoneDescription, milestoneAmount, milestoneDeadline } = req.body;

    const job = await Job.findById(id);
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    if (job.client.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: You can only modify your own jobs'), 403);
    }

    if (!job.isCrowdsourced) {
      return customErrorHandler(res, new Error('This job is not set for crowdsourcing'), 400);
    }

    const role = job.crowdsourcingRoles.find(r => r.title === roleTitle);
    if (!role) return customErrorHandler(res, new Error('Role not found'), 404);

    if (role.status === 'filled') {
      return customErrorHandler(res, new Error('This role has already been filled'), 400);
    }
    const bid = await Bid.findById(bidId);
    if (!bid) return customErrorHandler(res, new Error('Bid not found'), 404);
    if (bid.job.toString() !== job._id.toString()) {
      return customErrorHandler(res, new Error('Bid does not belong to this job'), 400);
    }

    // Create offer
    const offer = {
      freelancer: bid.freelancer,
      role: roleTitle,
      status: 'pending',
      milestoneTitle,
      milestoneDescription,
      milestoneAmount,
      milestoneDeadline
    };

    job.teamOffers = job.teamOffers || [];
    job.teamOffers.push(offer);
    await job.save();

    // Notify freelancer
    await Notification.create({
      recipient: bid.freelancer,
      type: 'job-updated',
      title: 'New Team Offer',
      message: `You've received an offer to join the team for "${job.title}" as ${roleTitle}. Please review and respond.`,
      data: {
        job: job._id,
        sender: req.user._id,
        bid: bid._id,
      },
    });

    // Send email notification
    const freelancer = await User.findById(bid.freelancer);
    await sendEmail({
      to: freelancer.email,
      subject:'New Team Offer',
      text:`You've received an offer to join the team for "${job.title}" as ${roleTitle}. Please log in to review and respond.`}
    );

    return successResponse(res, 200, 'Team offer sent successfully');
  } catch (error) {
    return customErrorHandler(res, error);
  }
};

/*
 * @desc    Complete a job (Client can mark as completed)
 * @route   PUT /api/jobs/:id/complete
 * @access  Private/Client
 */
export const completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('client hiredFreelancer');
    
    if (!job) {
      return customErrorHandler(res, 'Job not found', 404);
    }
    
    // Check if user is the job owner
    if (job.client._id.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, 'Not authorized. You can only complete your own jobs.', 403);
    }
    
    // Check if job is in progress
    if (job.status !== 'in-progress') {
      return customErrorHandler(res, `Cannot complete job with status: ${job.status}`, 400);
    }
    
    // Update job status
    job.status = 'completed';
    job.completionDate = new Date();
    await job.save();
    
    // Create notifications for review requests
    if (job.hiredFreelancer) {
      await Notification.create({
        recipient: job.hiredFreelancer._id,
        type: 'job-completed',
        title: 'Job Completed - Review Requested',
        message: `The job "${job.title}" has been completed. Please leave a review for the client.`,
        data: {
          job: job._id,
          client: job.client._id,
          action: 'review_client'
        },
      });
    }

    await Notification.create({
      recipient: job.client._id,
      type: 'job-completed',
      title: 'Job Completed - Review Requested',
      message: `You've marked the job "${job.title}" as completed. Please leave a review for the freelancer.`,
      data: {
        job: job._id,
        freelancer: job.hiredFreelancer?._id,
        action: 'review_freelancer'
      },
    });

    // Send email notifications
    if (job.hiredFreelancer) {
      await sendEmail({
        to: job.hiredFreelancer.email,
        subject: 'Job Completed - Review Requested',
        text: `The job "${job.title}" has been marked as completed by the client. Please log in to leave a review and provide feedback.`
      });
    }
    
    await sendEmail({
      to: job.client.email,
      subject: 'Job Marked as Completed',
      text: `You've marked the job "${job.title}" as completed. Please log in to leave a review for the freelancer.`
    });
    
    return successResponse(res, 200, {
      message: 'Job marked as completed successfully. Review notifications sent.',
      job: {
        _id: job._id,
        title: job.title,
        status: job.status,
        completionDate: job.completionDate
      }
    });
  } catch (error) {
    console.error('Complete job error:', error);
    return customErrorHandler(res, error.message, 500);
  }
};


export const cancelJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    // Check if user is the job owner or admin
    if (job.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized. You can only cancel your own jobs.');
    }
    
    // Check if job is already completed
    if (job.status === 'completed') {
      return errorResponse(res, 400, 'Cannot cancel a completed job');
    }
    
    // Update job status
    job.status = 'cancelled';
    await job.save();
    
    // If a freelancer was hired, notify them
    if (job.hiredFreelancer) {
      await Notification.create({
        recipient: job.hiredFreelancer,
        type: 'job_cancelled',
        title: 'Job Cancelled',
        message: 'This job has been cancelled by the client.',
        data: {
          job: job._id,
          sender: req.user._id,
        },
      });
      
      // Update the accepted bid if exists
      await Bid.findOneAndUpdate(
        { job: job._id, status: 'accepted' },
        { status: 'rejected' }
      );
    }
    
    return successResponse(res,200, {
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    return errorResponse(res, error.message, 500);
  }
};


export const getActiveAndCompletedJobs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let jobs;
    if (userRole === 'client') {
      jobs = await Job.find({
        client: userId,
        status: { $in: ['in-progress', 'completed'] }
      })
      .populate('client', 'name email profilePic')
      .populate('hiredFreelancer', 'name email profilePic')
      .populate('bids')
      .sort({ updatedAt: -1 });
    } else if (userRole === 'freelancer') {
      jobs = await Job.find({
        $or: [
          { hiredFreelancer: userId, status: { $in: ['in-progress', 'completed'] } },
          { 'team.freelancer': userId, status: { $in: ['in-progress', 'completed'] } }
        ]
      })
      .populate('client', 'name email profilePic')
      .populate('hiredFreelancer', 'name email profilePic')
      .populate('bids')
      .sort({ updatedAt: -1 });
    } else {
      return next(new ApiError(httpStatus.FORBIDDEN, 'Invalid user role'));
    }

    const formattedJobs = jobs.map(job => {
      const formattedJob = {
        _id: job._id,
        title: job.title,
        description: job.description,
        status: job.status,
        budget: job.budget,
        deadline: job.deadline,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completionDate: job.completionDate,
        skills: job.skills,
        category: job.category,
        subCategory: job.subCategory,
        attachments: job.attachments,
        isCrowdsourced: job.isCrowdsourced,
        client: {
          _id: job.client._id,
          name: job.client.name,
          email: job.client.email,
          profilePic: job.client.profilePic
        },
        milestones: job.milestones,
        bids: job.bids.map(bid => ({
          _id: bid._id,
          freelancer: bid.freelancer,
          amount: bid.amount,
          deliveryTime: bid.deliveryTime,
          status: bid.status
        }))
      };

      if (job.isCrowdsourced) {
        formattedJob.team = job.team.map(member => ({
          _id: member._id,
          freelancer: member.freelancer,
          role: member.role,
          status: member.status,
          milestones: member.milestones
        }));
      } else {
        formattedJob.hiredFreelancer = job.hiredFreelancer ? {
          _id: job.hiredFreelancer._id,
          name: job.hiredFreelancer.name,
          email: job.hiredFreelancer.email,
          profilePic: job.hiredFreelancer.profilePic
        } : null;
      }

      return formattedJob;
    });

    return successResponse(res, 200, {
      message: `${userRole === 'client' ? 'Client' : 'Freelancer'} jobs retrieved successfully.`,
      data: formattedJobs
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to fetch jobs.'));
  }
};



export const enableCrowdsourcing = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    const job = await Job.findById(id);
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    if (job.client.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: You can only modify your own jobs'), 403);
    }

    if (job.status !== 'open') {
      return customErrorHandler(res, new Error(`Cannot enable crowdsourcing for job with status ${job.status}`), 400);
    }

    job.isCrowdsourced = true;
    job.crowdsourcingRoles = roles.map(role => ({
      title: role.title,
      description: role.description,
      skills: role.skills,
      budget: role.budget,
      status: 'open'
    }));

    const conversation = new Conversation({
      participants: [job.client],
      job: job._id,
      isGroup: true,
      name: `Team for: ${job.title}`,
      admin: job.client
    });
    await conversation.save();
    
    job.groupConversation = conversation._id;
    await job.save();

    return successResponse(res, 200, 'Crowdsourcing enabled successfully', job);
  } catch (error) {
    return customErrorHandler(res, error);
  }
};



export const removeTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { feedback } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    const teamMember = job.team.id(memberId);
    if (!teamMember) return res.status(404).json({ message: 'Team member not found' });
    
    teamMember.status = 'removed';
    teamMember.removedAt = Date.now();
    teamMember.feedback = feedback;
    await job.save();
    
    // Remove freelancer from group conversation
    await Conversation.findByIdAndUpdate(job.groupConversation, 
      { $pull: { participants: teamMember.freelancer } });
    
    res.status(200).json({ message: 'Team member removed', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const addMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { freelancerId, title, description, amount, deadline } = req.body;

    const job = await Job.findById(id).populate('hiredFreelancer');
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    if (job.client.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: You can only add milestones to your own jobs'), 403);
    }

    const milestoneId = new mongoose.Types.ObjectId();
    const newMilestone = {
      _id: milestoneId,
      title,
      description,
      amount,
      deadline: new Date(deadline),
      status: 'in-progress'
    };

    let freelancer;

    if (job.isCrowdsourced) {
      const teamMember = job.team.find(member => member.freelancer.toString() === freelancerId);
      if (!teamMember) return customErrorHandler(res, new Error('Team member not found'), 404);
      teamMember.milestones.push(newMilestone);
      freelancer = await User.findById(freelancerId);
    } else {
      if (job.hiredFreelancer._id.toString() !== freelancerId) {
        return customErrorHandler(res, new Error('Freelancer not hired for this job'), 403);
      }
      job.milestones.push(newMilestone);
      freelancer = job.hiredFreelancer;
    }

    await job.save();

    // Update freelancer's hires and payments
    if (freelancer) {
      let hireEntry = freelancer.hires.find(hire => hire.job.toString() === job._id.toString());
      if (!hireEntry) {
        hireEntry = {
          job: job._id,
          activeMilestones: [],
          approvedMilestones: [],
          totalBudget: 0,
          earned: 0
        };
        freelancer.hires.push(hireEntry);
      }
      hireEntry.activeMilestones.push(milestoneId);
      hireEntry.totalBudget += amount;
      
      freelancer.payments = freelancer.payments || { inProgress: 0, pending: 0, available: 0 };
      freelancer.payments.inProgress += amount;
      
      await freelancer.save();
    }

    // Update client's hires
    const client = await User.findById(req.user._id);
    let clientHireEntry = client.hires.find(hire => hire.job.toString() === job._id.toString());
    if (!clientHireEntry) {
      clientHireEntry = {
        freelancer: {
          id: freelancer._id,
          name: freelancer.name,
          skills: freelancer.skills
        },
        job: {
          id: job._id,
          title: job.title,
          totalBudget: 0,
          paid: 0
        },
        activeMilestones: [],
        approvedMilestones: [],
        totalPaid: 0,
        pendingPayment: 0
      };
      client.hires.push(clientHireEntry);
    }
    clientHireEntry.job.totalBudget += amount;
    clientHireEntry.activeMilestones.push(milestoneId);
    clientHireEntry.pendingPayment += amount;
    await client.save();

    // Send email notification to freelancer
    await sendEmail({
      to: freelancer.email,
      subject: 'New Milestone Added',
      text: `A new milestone "${title}" has been added to the job "${job.title}". Please review it in your dashboard.`
    });

    return successResponse(res, 200, 'Milestone added successfully', { job, newMilestone });
  } catch (error) {
    return customErrorHandler(res, error);
  }
};

export const approveMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;

    const job = await Job.findById(id).populate('hiredFreelancer');
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    if (job.client.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: You can only approve milestones for your own jobs'), 403);
    }

    let milestone;
    let freelancer;

    if (job.isCrowdsourced) {
      const teamMember = job.team.find(member => 
        member.milestones.some(m => m._id.toString() === milestoneId)
      );
      if (!teamMember) return customErrorHandler(res, new Error('Milestone not found'), 404);
      milestone = teamMember.milestones.id(milestoneId);
      freelancer = await User.findById(teamMember.freelancer);
    } else {
      milestone = job.milestones.id(milestoneId);
      freelancer = job.hiredFreelancer;
    }

    if (!milestone) return customErrorHandler(res, new Error('Milestone not found'), 404);

    if (milestone.status !== 'submitted') {
      return customErrorHandler(res, new Error('Can only approve in-progress milestones'), 400);
    }

    // Update freelancer's hires and payments
    let hireEntry = freelancer.hires.find(hire => hire.job.toString() === job._id.toString());
    
    if (!hireEntry) {
      hireEntry = {
        job: job._id,
        activeMilestones: [],
        approvedMilestones: [],
        totalBudget: 0,
        earned: 0
      };
      freelancer.hires.push(hireEntry);
    }

    hireEntry.activeMilestones = hireEntry.activeMilestones.filter(m => m.toString() !== milestoneId);
    hireEntry.approvedMilestones.push(milestoneId);
    hireEntry.earned += milestone.amount;

    freelancer.payments = freelancer.payments || { inProgress: 0, pending: 0, available: 0 };
    freelancer.payments.inProgress = Math.max(0, (freelancer.payments.inProgress || 0) - milestone.amount);
    freelancer.payments.pending = (freelancer.payments.pending || 0) + milestone.amount;

    await freelancer.save();

    // Update client's hires
    const client = await User.findById(req.user._id);
    let clientHireEntry = client.hires.find(hire => hire.job.toString() === job._id.toString());
    if (clientHireEntry) {
      clientHireEntry.activeMilestones = clientHireEntry.activeMilestones.filter(m => m.toString() !== milestoneId);
      clientHireEntry.approvedMilestones.push(milestoneId);
      clientHireEntry.totalPaid += milestone.amount;
      clientHireEntry.pendingPayment -= milestone.amount;
      clientHireEntry.job.paid += milestone.amount;
    }
    await client.save();

    milestone.status = 'approved';
    milestone.approvalDate = new Date();
    await job.save();

    // Schedule payment to be available after 3 days
    setTimeout(async () => {
      try {
        const updatedFreelancer = await User.findById(freelancer._id);
        updatedFreelancer.payments.pending = Math.max(0, updatedFreelancer.payments.pending - milestone.amount);
        updatedFreelancer.payments.available = (updatedFreelancer.payments.available || 0) + milestone.amount;
        await updatedFreelancer.save();
        console.log('Scheduled payment update completed');
      } catch (error) {
        console.error('Error in scheduled payment update:', error);
      }
    }, 10 * 60 * 1000); // 3 days in milliseconds

    // Send email notification to freelancer
    await sendEmail({
      to: freelancer.email,
      subject: 'Milestone Approved',
      text: `Your milestone "${milestone.title}" for the job "${job.title}" has been approved. The payment will be processed soon.`
    });

    return successResponse(res, 200, 'Milestone approved successfully');
  } catch (error) {
    console.error('Error in approveMilestone:', error);
    return customErrorHandler(res, error);
  }
};

export const requestRevision = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { revisionDetails, attachments } = req.body;

    const job = await Job.findById(id).populate('hiredFreelancer');
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    if (job.client.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: You can only request revisions for your own jobs'), 403);
    }

    let milestone;
    let freelancer;

    if (job.isCrowdsourced) {
      const teamMember = job.team.find(member => 
        member.milestones.some(m => m._id.toString() === milestoneId)
      );
      if (!teamMember) return customErrorHandler(res, new Error('Milestone not found'), 404);
      milestone = teamMember.milestones.id(milestoneId);
      freelancer = await User.findById(teamMember.freelancer);
    } else {
      milestone = job.milestones.id(milestoneId);
      freelancer = job.hiredFreelancer;
    }

    if (!milestone) return customErrorHandler(res, new Error('Milestone not found'), 404);

    if (milestone.status !== 'submitted') {
      return customErrorHandler(res, new Error('Can only request revision for submitted milestones'), 400);
    }

    // Create or update the revision object
    milestone.revision = {
      details: revisionDetails,
      attachments: attachments,
      requestedAt: new Date(),
      status: 'pending'
    };

    milestone.status = 'in-revision';
    await job.save();

    // Send notification to freelancer
    await Notification.create({
      recipient: freelancer._id,
      type: 'revision-requested',
      title: 'Revision Requested',
      message: `A revision has been requested for the milestone "${milestone.title}" in job "${job.title}".`,
      data: {
        job: job._id,
        milestone: milestone._id,
      },
    });

    // Send email notification to freelancer
    await sendEmail({
      to: freelancer.email,
      subject: 'Revision Requested',
      text: `A revision has been requested for the milestone "${milestone.title}" in job "${job.title}". Please check your dashboard for details.`
    });

    return successResponse(res, 200, 'Revision requested successfully', { milestone });
  } catch (error) {
    console.error('Error in requestRevision:', error);
    return customErrorHandler(res, error);
  }
};

export const getAllClientJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find()
      .populate('client', 'name email profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalJobs = await Job.countDocuments();

    const jobsWithClientInfo = jobs.map(job => ({
      ...job.toObject(),
      clientName: job.client.name,
      clientEmail: job.client.email,
      clientProfileImage: job.client.profilePic
    }));

    sendResponse(res, httpStatus.OK, 'All client jobs retrieved successfully.', {
      jobs: jobsWithClientInfo,
      currentPage: page,
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs
    });
  } catch (error) {
    console.error('Error in getAllClientJobs:', error);
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to fetch all client jobs.'));
  }
};

export const getJobMilestones = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return customErrorHandler(res, new Error('Job not found'), 404);
    }

    let milestones = [];

    if (job.isCrowdsourced) {
      // For crowdsourced jobs, collect milestones from all team members
      job.team.forEach(member => {
        milestones = milestones.concat(member.milestones.map(milestone => ({
          ...milestone.toObject(),
          freelancerId: member.freelancer,
          freelancerRole: member.role
        })));
      });
    } else {
      // For regular jobs, use the job's milestones
      milestones = job.milestones;
    }

    return successResponse(res, 200, 'Milestones retrieved successfully', { 
      jobTitle: job.title,
      isCrowdsourced: job.isCrowdsourced,
      milestones 
    });
  } catch (error) {
    return customErrorHandler(res, error);
  }
};
// Save Job
export const saveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'User not found.'));
    }

    if (!user.savedJobs.includes(jobId)) {
      user.savedJobs.push(jobId);
      await user.save();
    }

    sendResponse(res, httpStatus.OK, 'Job saved successfully.');
  } catch (error) {
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not save job.'));
  }
};

// Unsave Job
export const unsaveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'User not found.'));
    }

    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
    await user.save();

    sendResponse(res, httpStatus.OK, 'Job unsaved successfully.');
  } catch (error) {
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not unsave job.'));
  }
};

export const getClientCrowdsourcedJobs = async (req, res, next) => {
  try {
    const clientId = req.user._id;

    const crowdsourcedJobs = await Job.find({
      client: clientId,
      isCrowdsourced: true
    }).populate('team.freelancer', 'name email profilePic')
      .populate('groupConversation')
      .sort({ createdAt: -1 });

    if (!crowdsourcedJobs || crowdsourcedJobs.length === 0) {
      return successResponse(res, 200, 'No crowdsourced jobs found for this client.', []);
    }

    const formattedJobs = crowdsourcedJobs.map(job => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      status: job.status,
      budget: job.budget,
      deadline: job.deadline,
      createdAt: job.createdAt,
      crowdsourcingRoles: job.crowdsourcingRoles,
      team: job.team.map(member => ({
        _id: member._id,
        freelancer: {
          _id: member.freelancer._id,
          name: member.freelancer.name,
          email: member.freelancer.email,
          profilePic: member.freelancer.profilePic
        },
        role: member.role,
        status: member.status,
        milestones: member.milestones
      })),
      groupConversationId: job.groupConversation ? job.groupConversation._id : null
    }));

    return successResponse(res, 200, 'Crowdsourced jobs retrieved successfully.', formattedJobs);
  } catch (error) {
    console.error('Error in getClientCrowdsourcedJobs:', error);
    return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to fetch crowdsourced jobs.'));
  }
};

export const getFreelancerCrowdsourcedJobs = async (req, res, next) => {
  try {
    const freelancerId = req.user._id;

    const crowdsourcedJobs = await Job.find({
      'team.freelancer': freelancerId,
      isCrowdsourced: true
    }).populate('client', 'name email profilePic')
      .populate('team.freelancer', 'name email profilePic')
      .populate('groupConversation')
      .sort({ createdAt: -1 });

    if (!crowdsourcedJobs || crowdsourcedJobs.length === 0) {
      return successResponse(res, 200, 'No crowdsourced jobs found for this freelancer.', []);
    }

    const formattedJobs = crowdsourcedJobs.map((job) => {
      const freelancerTeamMember = job.team.find(member => member.freelancer._id.toString() === freelancerId.toString());
      
      const teammates = job.team
        .filter(member => member.freelancer._id.toString() !== freelancerId.toString())
        .map(member => ({
          _id: member.freelancer._id,
          name: member.freelancer.name,
          email: member.freelancer.email,
          profilePic: member.freelancer.profilePic,
          role: member.role
        }));

      // Calculate total earnings from completed milestones
      const totalEarnings = freelancerTeamMember.milestones
        .filter(milestone => milestone.status === 'completed')
        .reduce((sum, milestone) => sum + milestone.amount, 0);

      // Calculate total amount of in-progress milestones
      const workInProgress = freelancerTeamMember.milestones
        .filter(milestone => milestone.status === 'in-progress')
        .reduce((sum, milestone) => sum + milestone.amount, 0);

      return {
        _id: job._id,
        title: job.title,
        description: job.description,
        status: job.status,
        totalBudget: job.budget,
        deadline: job.deadline,
        createdAt: job.createdAt,
        client: {
          _id: job.client._id,
          name: job.client.name,
          email: job.client.email,
          profilePic: job.client.profilePic
        },
        freelancerDetails: {
          teamId: freelancerTeamMember._id, // Include the teamId for the freelancer
          role: freelancerTeamMember.role,
          totalEarnings: totalEarnings,
          workInProgress: workInProgress,
          milestones: freelancerTeamMember.milestones,
          status: freelancerTeamMember.status
        },
        teammates: teammates,
        groupConversationId: job.groupConversation ? job.groupConversation._id : null
      };
    });

    return successResponse(res, 200, 'Crowdsourced jobs retrieved successfully.', formattedJobs);
  } catch (error) {
    console.error('Error in getFreelancerCrowdsourcedJobs:', error);
    return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to fetch crowdsourced jobs.'));
  }
};

/*
 * @desc    Submit work for job completion (Freelancer submits final work)
 * @route   PUT /api/jobs/:id/submit-work
 * @access  Private/Freelancer
 */
export const submitWorkForCompletion = async (req, res) => {
  try {
    const { message, attachments } = req.body;
    const job = await Job.findById(req.params.id).populate('client hiredFreelancer');
    
    if (!job) {
      return customErrorHandler(res, 'Job not found', 404);
    }
    
    // Check if user is the hired freelancer
    if (!job.hiredFreelancer || job.hiredFreelancer._id.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, 'Not authorized. You must be the hired freelancer.', 403);
    }
    
    // Check if job is in progress
    if (job.status !== 'in-progress') {
      return customErrorHandler(res, `Cannot submit work for job with status: ${job.status}`, 400);
    }
    
    // Add work submission data to job
    job.workSubmission = {
      message: message || '',
      attachments: attachments || [],
      submittedAt: new Date(),
      status: 'pending_client_review'
    };
    
    await job.save();
    
    // Create notification for client
    await Notification.create({
      recipient: job.client._id,
      type: 'job-completed',
      title: 'Work Submitted for Review',
      message: `${job.hiredFreelancer.firstName} has submitted work for the job "${job.title}". Please review and mark as completed.`,
      data: {
        job: job._id,
        freelancer: job.hiredFreelancer._id,
        action: 'review_work'
      },
    });

    // Send email notification to client
    await sendEmail({
      to: job.client.email,
      subject: 'Work Submitted for Review',
      text: `${job.hiredFreelancer.firstName} ${job.hiredFreelancer.lastName} has submitted work for the job "${job.title}". Please log in to review and mark the job as completed.`
    });
    
    return successResponse(res, 200, {
      message: 'Work submitted successfully. Client has been notified for review.',
      workSubmission: job.workSubmission
    });
  } catch (error) {
    console.error('Submit work error:', error);
    return customErrorHandler(res, error.message, 500);
  }
};