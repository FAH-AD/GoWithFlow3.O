import Review from '../models/Review.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = async (req, res) => {
  try {
    console.log('Create review request body:', req.body);
    console.log('User making request:', req.user._id);

    
    const {
      jobId,
      recipient,
      rating,
      comment,
      communication,
      qualityOfWork,
      valueForMoney,
      expertise,
      professionalism,
      isPublic
    } = req.body;

    console.log("recipient:", recipient);
    
    // Validate job
    const job = await Job.findById(jobId).populate('client hiredFreelancer');
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    // Validate recipient user
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return errorResponse(res, 404, 'Recipient user not found');
    }
    
    // Check if job is completed
    if (job.status !== 'completed') {
      return errorResponse(res, 400, 'You can only review completed jobs');
    }
    
    // Validate that job has both client and hired freelancer
    if (!job.client || !job.hiredFreelancer) {
      return errorResponse(res, 400, 'Job must have both a client and hired freelancer to submit reviews');
    }
    
    // Check if reviewer is either the client or the hired freelancer
    console.log('Checking if user is client or freelancer:', {
      userId: req.user,
    });
    const isClient = req.user.role === 'client' ;
    const isFreelancer = req.user.role === 'freelancer';

    if (!isClient && !isFreelancer) {
      return errorResponse(res, 403, 'You must be either the client or the hired freelancer to submit a review');
    }
    
    // Determine review type and validate recipient
    let reviewType = isClient ? 'client-to-freelancer' : 'freelancer-to-client';

    console.log('Review type:', reviewType);
    
    // Check if review already exists
    const existingReview = await Review.findOne({
      job: jobId,
      reviewer: req.user._id,
      recipient: recipient,
    });
    
    if (existingReview) {
      return errorResponse(res, 400, 'You have already submitted a review for this job');
    }
    
    // Create new review
    let review;
    try {
      review = await Review.create({
        job: jobId,
        reviewer: req.user._id,
        recipient: recipient,
        rating: parseInt(rating),
        comment,
        communication: parseInt(communication || rating),
        qualityOfWork: parseInt(qualityOfWork || rating),
        valueForMoney: parseInt(valueForMoney || rating),
        expertise: parseInt(expertise || rating),
        professionalism: parseInt(professionalism || rating),
        type: reviewType,
        isPublic: isPublic !== false, // Default to true unless explicitly false
      });
    } catch (error) {
      console.error('Review creation error:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        // Check if it's the expected duplicate (same job, reviewer, recipient)
        if (error.keyPattern && (error.keyPattern.job || error.keyPattern.reviewer || error.keyPattern.recipient)) {
          return errorResponse(res, 400, 'You have already submitted a review for this job');
        }
        
        // Handle legacy index issues
        if (error.message.includes('from_1_to_1_project_1') || 
            error.message.includes('from: null, to: null, project: null')) {
          return errorResponse(res, 500, 'Database configuration issue. Please contact support. (Legacy index conflict)');
        }
        
        // Generic duplicate error
        return errorResponse(res, 400, 'Duplicate review detected');
      }
      
      // Re-throw other errors
      throw error;
    }
    
    // Populate the review with user details
    await review.populate('reviewer', 'firstName lastName profileImage');
    await review.populate('recipient', 'firstName lastName profileImage');
    await review.populate('job', 'title');
    
    // Create notification for review recipient
    await Notification.create({
      recipient: recipient,
      type: 'new-review',
      title: 'New Review Received',
      message: `You've received a ${rating}-star review for the job "${job.title}"`,
      data: {
        job: job._id,
        reviewer: req.user._id,
        review: review._id,
      },
    });
    
    return successResponse(res, 201, 'Review submitted successfully', {
      review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get reviews for a user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    console.log('Fetching reviews for user:', userId);
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    // Build query - only public reviews unless viewing your own
    const query = { recipient: userId };
    
    // If no user is authenticated or viewing someone else's profile, only show public reviews
    if (!req.user || req.user._id.toString() !== userId) {
      query.isPublic = true;
    }
    
    console.log('Review query:', query);
    console.log('Requesting user:', req.user ? req.user._id : 'not authenticated');
    console.log('Target user:', userId);
    
    // Count total reviews
    const totalReviews = await Review.countDocuments(query);
    console.log('Total reviews found:', totalReviews);
    
    // Get reviews
    const reviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName profileImage')
      .populate('job', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    console.log('Reviews retrieved:', reviews.length);
    
    // Get review statistics
    const reviewStats = await Review.getReviewStats(userId);
    
    return successResponse(res, 200, 'Reviews retrieved successfully', {
      reviews,
      stats: reviewStats,
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get reviews for a job
 * @route   GET /api/reviews/job/:jobId
 * @access  Public
 */
export const getJobReviews = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    // Check if job exists and populate client and hiredFreelancer
    const job = await Job.findById(jobId).populate('client hiredFreelancer');
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    console.log('Job found for reviews:', {
      _id: job._id,
      client: job.client?._id,
      hiredFreelancer: job.hiredFreelancer?._id
    });
    
    // Get client and freelancer reviews
    const clientReview = await Review.findOne({
      job: jobId,
      reviewer: job.client?._id,
    }).populate('reviewer', 'firstName lastName profileImage role')
      .populate('job', 'title');
    
    const freelancerReview = await Review.findOne({
      job: jobId,
      reviewer: job.hiredFreelancer?._id,
    }).populate('reviewer', 'firstName lastName profileImage role')
      .populate('job', 'title');
    
    console.log('Found reviews:', {
      clientReview: clientReview ? clientReview._id : 'none',
      freelancerReview: freelancerReview ? freelancerReview._id : 'none'
    });
    
    return successResponse(res, 200, 'Job reviews retrieved successfully', {
      clientReview,
      freelancerReview,
    });
  } catch (error) {
    console.error('Get job reviews error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
export const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }
    
    // Check if user is the review author
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'You can only update your own reviews');
    }
    
    // Check if review is less than 30 days old
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (review.createdAt < thirtyDaysAgo) {
      return errorResponse(res, 400, 'Reviews can only be updated within 30 days of creation');
    }
    
    // Update review fields
    const {
      rating,
      content,
      communication,
      quality,
      expertise,
      deadlineAdherence,
      overallExperience,
      isPublic,
    } = req.body;
    
    if (rating) review.rating = parseInt(rating);
    if (content) review.content = content;
    if (communication) review.categories.communication = parseInt(communication);
    if (quality) review.categories.quality = parseInt(quality);
    if (expertise) review.categories.expertise = parseInt(expertise);
    if (deadlineAdherence) review.categories.deadlineAdherence = parseInt(deadlineAdherence);
    if (overallExperience) review.categories.overallExperience = parseInt(overallExperience);
    if (isPublic !== undefined) review.isPublic = isPublic;
    
    await review.save();
    
    // Create notification for review recipient
    await Notification.create({
      recipient: review.recipient,
      type: 'new_review',
      title: 'Review Updated',
      message: `A review you received has been updated`,
      data: {
        job: review.job,
        sender: req.user._id,
        review: review._id,
      },
    });
    
    return successResponse(res, 200, 'Review updated successfully', {
      review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }
    
    // Check if user is the review author or an admin
    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'You can only delete your own reviews');
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    return successResponse(res, 200, 'Review deleted successfully');
  } catch (error) {
    console.error('Delete review error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Report a review
 * @route   POST /api/reviews/:id/report
 * @access  Private
 */
export const reportReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { reason } = req.body;
    
    if (!reason) {
      return errorResponse(res, 400, 'Report reason is required');
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }
    
    // Check if the reporter is the review recipient
    if (review.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'You can only report reviews about yourself');
    }
    
    // Update review with report information - using the fields that exist in the model
    review.isReported = true;
    review.reportReason = reason;
    review.reportedBy = req.user._id;
    review.reportedAt = new Date();
    
    await review.save();
    
    // Notify admins (through a notification to a dummy admin account or other mechanism)
    // This is placeholder logic; in a real system, you might have a way to notify all admins
    const adminUsers = await User.find({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await Notification.create({
        recipient: admin._id,
        type: 'system_notification',
        title: 'Review Reported',
        message: `A review has been reported for violation. Reason: ${reason}`,
        data: {
          review: review._id,
          sender: req.user._id,
        },
      });
    }
    
    return successResponse(res, 200, 'Review reported successfully. Our team will review it shortly.');
  } catch (error) {
    console.error('Report review error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Mark a review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
export const markReviewAsHelpful = async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }
    
    // Check if user has already marked this review as helpful
    const alreadyMarked = review.helpfulVotes.some(
      item => item.user.toString() === req.user._id.toString()
    );
    
    if (alreadyMarked) {
      // Remove the helpful mark
      review.helpfulVotes = review.helpfulVotes.filter(
        item => item.user.toString() !== req.user._id.toString()
      );
      
      await review.save();
      
      return successResponse(res, 200, 'Removed helpful mark from review', {
        helpfulCount: review.helpfulVotes.length,
      });
    } else {
      // Add the helpful mark
      review.helpfulVotes.push({ user: req.user._id });
      
      await review.save();
      
      return successResponse(res, 200, 'Marked review as helpful', {
        helpfulCount: review.helpfulVotes.length,
      });
    }
  } catch (error) {
    console.error('Mark review as helpful error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get reported reviews
 * @route   GET /api/reviews/reported
 * @access  Private/Admin
 */
export const getReportedReviews = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to access reported reviews');
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get only reported reviews
    const query = { isReported: true };
    
    // Count total reported reviews
    const totalReported = await Review.countDocuments(query);
    
    // Get reported reviews
    const reportedReviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName profileImage')
      .populate('recipient', 'firstName lastName profileImage')
      .populate('job', 'title')
      .populate('reportedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ reportedAt: -1 });
    
    return successResponse(res, 200, 'Reported reviews retrieved successfully', {
      reportedReviews,
      page,
      limit,
      totalReported,
      totalPages: Math.ceil(totalReported / limit),
    });
  } catch (error) {
    console.error('Get reported reviews error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get review statistics
 * @route   GET /api/reviews/stats
 * @access  Private/Admin
 */
export const getReviewStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to access review statistics');
    }
    
    // Overall review count
    const totalReviews = await Review.countDocuments();
    
    // Average rating
    const ratingStats = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          fiveStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
          },
          fourStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
          },
          threeStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
          },
          twoStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
          },
          oneStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
          },
        },
      },
    ]);
    
    // Category averages
    const categoryStats = await Review.aggregate([
      {
        $group: {
          _id: null,
          communication: { $avg: '$categories.communication' },
          quality: { $avg: '$categories.quality' },
          expertise: { $avg: '$categories.expertise' },
          deadlineAdherence: { $avg: '$categories.deadlineAdherence' },
          overallExperience: { $avg: '$categories.overallExperience' },
        },
      },
    ]);
    
    // Monthly review counts for the current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Review.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Format monthly stats to include all months
    const formattedMonthlyStats = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = monthlyStats.find(stat => stat._id === month);
      
      return {
        month,
        count: monthData ? monthData.count : 0,
        averageRating: monthData ? monthData.averageRating : 0,
      };
    });
    
    return successResponse(res, 200, 'Review statistics retrieved successfully', {
      totalReviews,
      averageRating: ratingStats.length > 0 ? ratingStats[0].averageRating : 0,
      starCounts: ratingStats.length > 0 ? {
        oneStar: ratingStats[0].oneStarCount,
        twoStar: ratingStats[0].twoStarCount,
        threeStar: ratingStats[0].threeStarCount,
        fourStar: ratingStats[0].fourStarCount,
        fiveStar: ratingStats[0].fiveStarCount,
      } : {
        oneStar: 0,
        twoStar: 0,
        threeStar: 0,
        fourStar: 0,
        fiveStar: 0,
      },
      categoryAverages: categoryStats.length > 0 ? {
        communication: categoryStats[0].communication,
        quality: categoryStats[0].quality,
        expertise: categoryStats[0].expertise,
        deadlineAdherence: categoryStats[0].deadlineAdherence,
        overallExperience: categoryStats[0].overallExperience,
      } : {
        communication: 0,
        quality: 0,
        expertise: 0,
        deadlineAdherence: 0,
        overallExperience: 0,
      },
      monthlyStats: formattedMonthlyStats,
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    return errorResponse(res, 500, error.message);
  }
};
