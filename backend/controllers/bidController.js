import Bid from '../models/Bid.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Submit a bid for a job
 * @route   POST /api/bids
 * @access  Private/Freelancer
 */
export const submitBid = async (req, res) => {
  const {
    jobId,
    budget,
    deliveryTime,
    deliveryTimeUnit,
    proposal,
    attachments,
    milestones,
    role, // This will be the role title, e.g., "Frontend Developer"
  } = req.body;

  try {
    // Step 1: Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
  

    // Step 2: Check if the freelancer has already bid on this job
    const existingBid = await Bid.findOne({
      job: jobId,
      freelancer: req.user._id,
    });

    if (existingBid) {
      // If it's a crowdsourced job, provide more specific information
      if (job.isCrowdsourced) {
        return res.status(400).json({
          success: false,
          message: `You have already submitted a bid for this job for the role: ${existingBid.role}. You cannot submit multiple bids for the same job, even for different roles.`,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a bid for this job. You cannot submit multiple bids for the same job.',
        });
      }
    }

    // Step 3: Check if the job is crowdsourced and validate role
    if (job.isCrowdsourced) {
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required for crowdsourced jobs',
        });
      }
      const validRole = job.crowdsourcingRoles.find(r => r.title === role);
      if (!validRole) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role for this crowdsourced job',
        });
      }
      if (validRole.status !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'This role is no longer open for bidding',
        });
      }
    } else if (role) {
      return res.status(400).json({
        success: false,
        message: 'Role should not be specified for non-crowdsourced jobs',
      });
    }

    // Step 4: Create and save new bid
    const newBid = new Bid({
      job: jobId,
      freelancer: req.user._id,
      budget,
      deliveryTime,
      deliveryTimeUnit,
      proposal,
      attachments,
      milestones,
      ...(job.isCrowdsourced && { role }),
      isRead: false,
    });

    const savedBid = await newBid.save().catch(err => {
      console.warn('Error saving bid:', err);
      return null;
    });

    if (!savedBid) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save bid',
      });
    }

    // Step 5: Increment bid count without validating the whole job document
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { bidCount: 1 } },
      { new: true }
    ).catch(err => {
      console.warn('Error updating bid count:', err);
      return null;
    });

    if (!updatedJob) {
      return res.status(500).json({
        success: false,
        message: 'Bid submitted, but failed to update job bid count',
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      message: 'Bid submitted successfully',
      bid: savedBid,
    });
  } catch (error) {
    console.error('Submit bid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get all bids for a job
 * @route   GET /api/bids/job/:jobId
 * @access  Private/Client
 */
export const getBidsByJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);

    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    // Check if the user requesting is the job owner (client)
    const isClient = job.client.toString() === req.user._id.toString();

    const bids = await Bid.find({ job: jobId }).populate({
      path: 'freelancer',
      select: '_id name email profilePic successRate completedJobs',
      model: User
    });
    
    let organizedBids;
    const currentUserBid = bids.find(bid => bid.freelancer._id.toString() === req.user._id.toString());
    const hasApplied = !!currentUserBid;

    if (job.isCrowdsourced) {
      organizedBids = job.crowdsourcingRoles.reduce((acc, role) => {
        acc[role.title] = bids.filter(bid => bid.role === role.title).map(bid => ({
          ...bid.toObject(),
          freelancer: {
            _id: bid.freelancer._id,
            name: bid.freelancer.name,
            email: bid.freelancer.email,
            profilePicture: bid.freelancer.profilePic,
            successRate: bid.freelancer.successRate,
            completedJobs: bid.freelancer.completedJobs
          },
          offerSent: job.teamOffers.some(offer => 
            offer.freelancer.toString() === bid.freelancer._id.toString() && 
            offer.role === bid.role
          )
        }));
        return acc;
      }, {});
    } else {
      organizedBids = bids.map(bid => ({
        ...bid.toObject(),
        freelancer: {
          _id: bid.freelancer._id,
          name: bid.freelancer.name,
          email: bid.freelancer.email,
          profilePicture: bid.freelancer.profilePic,
          successRate: bid.freelancer.successRate,
          completedJobs: bid.freelancer.completedJobs
        },
        offerSent: job.offers.some(offer => 
          offer.freelancer.toString() === bid.freelancer._id.toString()
        )
      }));
    }

    // If the user is the client, mark all unread bids as read
    if (isClient) {
      const unreadBids = bids.filter(bid => !bid.isRead);
      if (unreadBids.length > 0) {
        await Bid.updateMany(
          { _id: { $in: unreadBids.map(bid => bid._id) } },
          { $set: { isRead: true } }
        );
      }
    }

    return successResponse(res, 200, 'Bids retrieved successfully', { 
      jobTitle: job.title,
      isCrowdsourced: job.isCrowdsourced,
      bids: organizedBids,
      hasApplied
    });
  } catch (error) {
    console.error('Get bids by job error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get all bids by current freelancer
 * @route   GET /api/bids/my-bids
 * @access  Private/Freelancer
 */
export const getMyBids = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Status filter
    const status = req.query.status || '';
    
    // Build query
    const query = { freelancer: req.user._id };
    
    if (status && ['pending', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      query.status = status;
    }
    
    // Count total bids
    const totalBids = await Bid.countDocuments(query);
    
    // Fetch bids
    const bids = await Bid.find(query)
      .populate({
        path: 'job',
        select: 'title budget status client isCrowdsourced',
        populate: {
          path: 'client',
          select: 'firstName lastName profileImage',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    return successResponse(res,200, {
      bids,
      page,
      limit,
      totalBids,
      totalPages: Math.ceil(totalBids / limit),
    });
  } catch (error) {
    console.error('Get my bids error:', error);
    return errorResponse(res,500, error.message);
  }
};

/**
 * @desc    Get bid by ID
 * @route   GET /api/bids/:id
 * @access  Private
 */
export const getBidById = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('freelancer', 'firstName lastName profileImage email')
      .populate({
        path: 'job',
        populate: {
          path: 'client',
          select: 'firstName lastName profileImage',
        },
      });
    
    if (!bid) {
      return errorResponse(res, 'Bid not found', 404);
    }
    
    // Check if user is the bid owner, job owner, or admin
    const isFreelancer = bid.freelancer._id.toString() === req.user._id.toString();
    const isClient = bid.job.client._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isFreelancer && !isClient && !isAdmin) {
      return errorResponse(res, 'Not authorized to view this bid', 403);
    }
    
    return successResponse(res, { bid });
  } catch (error) {
    console.error('Get bid by ID error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Update bid
 * @route   PUT /api/bids/:id
 * @access  Private/Freelancer
 */
export const updateBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    
    if (!bid) {
      return errorResponse(res, 'Bid not found', 404);
    }
    
    // Check if user is the bid owner
    if (bid.freelancer.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to update this bid', 403);
    }
    
    // Check if bid is still pending
    if (bid.status !== 'pending') {
      return errorResponse(res, `Cannot update bid with status ${bid.status}`, 400);
    }
    
    // Check if job is still open
    const job = await Job.findById(bid.job);
    if (!job || job.status !== 'open') {
      return errorResponse(res, 'Cannot update bid for a job that is not open', 400);
    }
    
    // Update bid fields
    const { budget, proposal, deliveryTime, milestones } = req.body;
    
    if (budget) bid.budget = parseFloat(budget);
    if (proposal) bid.proposal = proposal;
    if (deliveryTime) bid.deliveryTime = parseInt(deliveryTime);
    
    // Update milestones if provided
    if (milestones) {
      try {
        bid.milestones = typeof milestones === 'string' ? JSON.parse(milestones) : milestones;
      } catch (error) {
        return errorResponse(res, 'Invalid milestones format', 400);
      }
    }
    
    // Handle file attachments
    if (req.files && req.files.length > 0) {
      // Delete old attachments if specified
      
      
      // Add new attachments
      const newAttachments = req.files.map(file => ({
        name: file.originalname,
        path: file.path,
        mimeType: file.mimetype,
      }));
      
      bid.attachments = [...bid.attachments, ...newAttachments];
    }
    
    // Save updated bid
    await bid.save();
    
    return successResponse(res, {
      bid,
      message: 'Bid updated successfully',
    });
  } catch (error) {
    console.error('Update bid error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Withdraw bid
 * @route   DELETE /api/bids/:id/withdraw
 * @access  Private/Freelancer
 */
export const withdrawBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    
    if (!bid) {
      return errorResponse(res, 'Bid not found', 404);
    }
    
    // Check if user is the bid owner
    if (bid.freelancer.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to withdraw this bid', 403);
    }
    
    // Check if bid is still pending
    if (bid.status !== 'pending') {
      return errorResponse(res, `Cannot withdraw bid with status ${bid.status}`, 400);
    }
    
    // Update bid status
    bid.status = 'withdrawn';
    await bid.save();
    
    // Remove bid from job
    await Job.findByIdAndUpdate(bid.job, {
      $pull: { bids: bid._id },
    });
    
    return successResponse(res, {
      message: 'Bid withdrawn successfully',
    });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Add client feedback to bid
 * @route   PUT /api/bids/:id/feedback
 * @access  Private/Client
 */
export const addBidFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    
    const bid = await Bid.findById(req.params.id).populate('job');
    
    if (!bid) {
      return errorResponse(res, 'Bid not found', 404);
    }
    
    // Check if user is the job owner
    if (bid.job.client.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to add feedback to this bid', 403);
    }
    
    // Add feedback
    bid.clientFeedback = feedback;
    await bid.save();
    
    // Create notification for freelancer
    await Notification.create({
      recipient: bid.freelancer,
      type: 'system_notification',
      title: 'New Feedback on Your Bid',
      message: `The client has provided feedback on your bid for "${bid.job.title}"`,
      data: {
        job: bid.job._id,
        sender: req.user._id,
        bid: bid._id,
      },
    });
    
    return successResponse(res, {
      message: 'Feedback added successfully',
    });
  } catch (error) {
    console.error('Add bid feedback error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// New function to mark a single bid as read
export const markBidAsRead = async (req, res) => {
  try {
    const bidId = req.params.bidId;
    const bid = await Bid.findById(bidId).populate('job');

    if (!bid) {
      return errorResponse(res, 'Bid not found', 404);
    }

    // Check if the user requesting is the job owner (client)
    if (bid.job.client.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to mark this bid as read', 403);
    }

    if (!bid.isRead) {
      bid.isRead = true;
      await bid.save();
    }

    return successResponse(res, 200, 'Bid marked as read successfully');
  } catch (error) {
    console.error('Mark bid as read error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getBidStats = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);

    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }   

    // Get total bids
    const totalBids = await Bid.countDocuments({ job: jobId });

    // Get total interviewing
    const totalInterviewing = job.interviewedFreelancers.length;

    // Get total hires
    let totalHires = 0;
    if (job.isCrowdsourced) {
      totalHires = job.team.length;
    } else if (job.hiredFreelancer) {
      totalHires = 1;
    }

    // Get bids by status
    const bidsByStatus = await Bid.aggregate([
      { $match: { job: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const bidStats = {
      totalBids,
      totalInterviewing,
      totalHires,
      bidsByStatus: Object.fromEntries(bidsByStatus.map(item => [item._id, item.count])),
      jobStatus: job.status
    };

    return successResponse(res, 200, 'Bid stats retrieved successfully', bidStats);
  } catch (error) {
    console.error('Get bid stats error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get freelancer's bid for a specific job
 * @route   GET /api/bids/job/:jobId/freelancer
 * @access  Private/Freelancer
 */
export const getFreelancerBidForJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const freelancerId = req.user._id;

    const bid = await Bid.findOne({ job: jobId, freelancer: freelancerId })
      .populate('job', 'title status')
      .lean();

    if (!bid) {
      return successResponse(res, 200, 'Freelancer has not bid on this job', { hasApplied: false });
    }

    return successResponse(res, 200, 'Bid retrieved successfully', {
      hasApplied: true,
      bid: {
        ...bid,
        job: {
          _id: bid.job._id,
          title: bid.job.title,
          status: bid.job.status
        }
      }
    });
  } catch (error) {
    console.error('Get freelancer bid for job error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};



