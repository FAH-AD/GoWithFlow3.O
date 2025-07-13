import User from '../models/User.js';
import Job from '../models/Job.js';
import Bid from '../models/Bid.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Category from '../models/Category.js';
import Issue from '../models/Issue.js';
import { sendEmail } from '../utils/sendEmail.js';

// Activity Log Schema (you may want to create a separate model for this)
const ActivityLog = {
  async createLog(type, user, action, details = {}) {
    // For now, we'll use the Notification model to store activity logs
    // In a real application, you might want to create a separate ActivityLog model
    return await Notification.create({
      recipient: user,
      type: 'system-notification',
      title: `${type} Activity`,
      message: action,
      data: { activityType: type, ...details },
      createdAt: new Date(),
    });
  },

  async getLogs(limit = 50, type = null) {
    const query = { type: 'system-notification' };
    if (type) {
      query['data.activityType'] = type;
    }
    
    return await Notification.find(query)
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
};

// Helper functions for consistent responses
const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setDate(1)), // First day of current month
      },
    });
    
    // Job statistics
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const inProgressJobs = await Job.countDocuments({ status: 'in-progress' });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const cancelledJobs = await Job.countDocuments({ status: 'cancelled' });
    
    // Bid statistics
    const totalBids = await Bid.countDocuments();
    const acceptedBids = await Bid.countDocuments({ status: 'accepted' });
    
    // Payment statistics
    const paymentStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalServiceFee: { $sum: '$serviceFee' },
          completedPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
          completedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0],
            },
          },
        },
      },
    ]);
    
    // Get monthly user registrations for the current year
    const currentYear = new Date().getFullYear();
    
    const monthlyUserRegistrations = await User.aggregate([
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
          clients: {
            $sum: {
              $cond: [{ $eq: ['$role', 'client'] }, 1, 0],
            },
          },
          freelancers: {
            $sum: {
              $cond: [{ $eq: ['$role', 'freelancer'] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Format monthly data to include all months
    const formattedMonthlyRegistrations = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = monthlyUserRegistrations.find(data => data._id === month);
      
      return {
        month,
        count: monthData ? monthData.count : 0,
        clients: monthData ? monthData.clients : 0,
        freelancers: monthData ? monthData.freelancers : 0,
      };
    });
    
    // Get monthly job creation stats
    const monthlyJobs = await Job.aggregate([
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
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Format monthly job data
    const formattedMonthlyJobs = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = monthlyJobs.find(data => data._id === month);
      
      return {
        month,
        count: monthData ? monthData.count : 0,
      };
    });

    // Get monthly revenue stats
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalRevenue: { $sum: '$amount' },
          serviceFee: { $sum: '$serviceFee' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Format monthly revenue data
    const formattedMonthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = monthlyRevenue.find(data => data._id === month);
      
      return {
        month,
        revenue: monthData ? monthData.totalRevenue : 0,
        serviceFee: monthData ? monthData.serviceFee : 0,
        transactions: monthData ? monthData.transactionCount : 0,
      };
    });
    
    return successResponse(res, {
      userStats: {
        totalUsers,
        totalClients,
        totalFreelancers,
        totalAdmins,
        newUsersThisMonth,
        monthlyRegistrations: formattedMonthlyRegistrations,
      },
      jobStats: {
        totalJobs,
        openJobs,
        inProgressJobs,
        completedJobs,
        cancelledJobs,
        monthlyJobs: formattedMonthlyJobs,
      },
      bidStats: {
        totalBids,
        acceptedBids,
        averageBidsPerJob: totalJobs > 0 ? (totalBids / totalJobs).toFixed(2) : 0,
      },
      paymentStats: {
        totalPayments: paymentStats.length > 0 ? paymentStats[0].completedPayments : 0,
        totalAmount: paymentStats.length > 0 ? paymentStats[0].totalAmount : 0,
        totalServiceFee: paymentStats.length > 0 ? paymentStats[0].totalServiceFee : 0,
        completedAmount: paymentStats.length > 0 ? paymentStats[0].completedAmount : 0,
        monthlyRevenue: formattedMonthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get all users with filtering and pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query with filters
    const query = {};
    
    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    // Filter by active status
    if (req.query.isActive) {
      query.isActive = req.query.isActive === 'true';
    }
    
    // Filter by verified status
    if (req.query.isVerified) {
      query.isEmailVerified = req.query.isVerified === 'true';
    }
    
    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    
    // Registration date range
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
      query.createdAt = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.createdAt = { $lte: new Date(req.query.endDate) };
    }
    
    // Count total matching users
    const totalUsers = await User.countDocuments(query);
    
    // Fetch users
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort(req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 });
    
    return successResponse(res, {
      users,
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PUT /api/admin/users/:userId/status
 * @access  Private/Admin
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Cannot deactivate own account
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot change the status of your own account', 400);
    }
    
    // Update status
    user.isActive = isActive;
    await user.save();
    
    // Create notification for user
    await Notification.create({
      recipient: user._id,
      type: 'system-notification',
      title: isActive ? 'Account Activated' : 'Account Deactivated',
      message: isActive 
        ? 'Your account has been activated by an administrator.' 
        : 'Your account has been deactivated by an administrator. Please contact support for assistance.',
      data: {
        sender: req.user._id,
      },
    });
    
    // Log the activity
    await ActivityLog.createLog('User', req.user._id, `User ${isActive ? 'activated' : 'deactivated'} by admin`, {
      targetUser: userId,
    });
    
    return successResponse(res, {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Change user role
 * @route   PUT /api/admin/users/:userId/role
 * @access  Private/Admin
 */
export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['client', 'freelancer', 'admin'].includes(role)) {
      return errorResponse(res, 'Invalid role. Must be client, freelancer, or admin.', 400);
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Cannot change own role
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot change your own role', 400);
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    // Create notification for user
    await Notification.create({
      recipient: user._id,
      type: 'role_changed',
      title: 'Role Changed',
      message: `Your account role has been changed to ${role} by an administrator.`,
      data: {
        sender: req.user._id,
        newRole: role,
      },
    });
    
    // Log the activity
    await ActivityLog.createLog('User', req.user._id, `User role changed to ${role} by admin`, {
      targetUser: userId,
    });
    
    return successResponse(res, {
      message: `User role changed to ${role} successfully`,
    });
  } catch (error) {
    console.error('Change user role error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Send warning message to user
 * @route   POST /api/admin/users/:userId/warning
 * @access  Private/Admin
 */
export const sendUserWarning = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return errorResponse(res, 'Warning message is required', 400);
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Create notification for user
    await Notification.create({
      recipient: user._id,
      type: 'warning',
      title: 'Warning from Administration',
      message: message,
      data: {
        sender: req.user?._id || null,
        senderName: req.user?.name || 'Admin',
        isWarning: true,
      },
    });
    
    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'Warning from GoWithFlow Administration',
        text: `Dear ${user.name},\n\nYou have received a warning from our administration team:\n\n${message}\n\nPlease ensure you follow our platform guidelines to avoid any account restrictions.\n\nBest regards,\nGoWithFlow Team`,
      });
    } catch (emailError) {
      console.error('Failed to send warning email:', emailError);
    }
    
    // Log the activity (only if req.user exists)
    if (req.user?._id) {
      try {
        await ActivityLog.createLog('Admin', req.user._id, `Warning sent to user: ${user.name}`, {
          targetUser: userId,
          warningMessage: message,
        });
      } catch (logError) {
        console.error('Failed to create activity log:', logError);
      }
    }
    
    return successResponse(res, {
      message: 'Warning sent successfully',
    });
  } catch (error) {
    console.error('Send user warning error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Deactivate user account
 * @route   PUT /api/admin/users/:userId/deactivate
 * @access  Private/Admin
 */
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Cannot deactivate own account
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot deactivate your own account', 400);
    }
    
    // Cannot deactivate another admin (unless you're a super admin)
    if (user.role === 'admin' && req.user.role !== 'super_admin') {
      return errorResponse(res, 'You cannot deactivate another admin account', 403);
    }
    
    // Update user status
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.user._id;
    user.deactivationReason = reason || 'Account deactivated by admin';
    await user.save();
    
    // Create notification for user
    await Notification.create({
      recipient: user._id,
      type: 'account_deactivated',
      title: 'Account Deactivated',
      message: `Your account has been deactivated by an administrator. Reason: ${reason || 'Not specified'}`,
      data: {
        sender: req.user._id,
        senderName: req.user.name,
        reason: reason,
      },
    });
    
    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'Account Deactivated - GoWithFlow',
        text: `Dear ${user.name},\n\nYour account has been deactivated by our administration team.\n\nReason: ${reason || 'Not specified'}\n\nIf you believe this is an error, please contact our support team.\n\nBest regards,\nGoWithFlow Team`,
      });
    } catch (emailError) {
      console.error('Failed to send deactivation email:', emailError);
    }
    
    // Log the activity
    await ActivityLog.createLog('Admin', req.user._id, `User account deactivated: ${user.name}`, {
      targetUser: userId,
      reason: reason,
    });
    
    return successResponse(res, {
      message: 'User account deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Reactivate user account
 * @route   PUT /api/admin/users/:userId/reactivate
 * @access  Private/Admin
 */
export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    if (user.isActive) {
      return errorResponse(res, 'User account is already active', 400);
    }
    
    // Update user status
    user.isActive = true;
    user.reactivatedAt = new Date();
    user.reactivatedBy = req.user._id;
    user.reactivationReason = reason || 'Account reactivated by admin';
    // Clear deactivation fields
    user.deactivatedAt = undefined;
    user.deactivatedBy = undefined;
    user.deactivationReason = undefined;
    await user.save();
    
    // Create notification for user
    await Notification.create({
      recipient: user._id,
      type: 'account_reactivated',
      title: 'Account Reactivated',
      message: `Your account has been reactivated by an administrator. Welcome back!`,
      data: {
        sender: req.user._id,
        senderName: req.user.name,
        reason: reason,
      },
    });
    
    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'Account Reactivated - GoWithFlow',
        text: `Dear ${user.name},\n\nGood news! Your account has been reactivated by our administration team.\n\nReason: ${reason || 'Account review completed'}\n\nYou can now log in and use all platform features.\n\nWelcome back!\nGoWithFlow Team`,
      });
    } catch (emailError) {
      console.error('Failed to send reactivation email:', emailError);
    }
    
    // Log the activity
    await ActivityLog.createLog('Admin', req.user._id, `User account reactivated: ${user.name}`, {
      targetUser: userId,
      reason: reason,
    });
    
    return successResponse(res, {
      message: 'User account reactivated successfully',
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get issue statistics for admin dashboard
 * @route   GET /api/admin/issues/stats
 * @access  Private/Admin
 */
export const getIssueStatsForDashboard = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: 'open' });
    const inProgressIssues = await Issue.countDocuments({ status: 'in_progress' });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const closedIssues = await Issue.countDocuments({ status: 'closed' });

    // Get priority breakdown
    const priorityStats = await Issue.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get category breakdown
    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent issues
    const recentIssues = await Issue.find()
      .populate('submittedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category priority status createdAt submittedBy');

    return successResponse(res, {
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      priorityBreakdown: priorityStats,
      categoryBreakdown: categoryStats,
      recentIssues,
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get all issues for admin management
 * @route   GET /api/admin/issues
 * @access  Private/Admin
 */
export const getAllIssuesForAdmin = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      assignedTo,
      submittedBy,
      page = 1,
      limit = 20,
      sortBy = 'lastActivityAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (submittedBy) query.submittedBy = submittedBy;

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const totalCount = await Issue.countDocuments(query);

    // Get issues
    const issues = await Issue.find(query)
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('relatedJob', 'title status')
      .populate('relatedPayment', 'amount status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, {
      issues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
      },
    });
  } catch (error) {
    console.error('Get all issues for admin error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Handle reported review
 * @route   PUT /api/admin/reviews/:reviewId/report
 * @access  Private/Admin
 */
export const handleReportedReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action, adminNotes } = req.body;
    
    // Validate action
    if (!['approve', 'reject', 'delete'].includes(action)) {
      return errorResponse(res, 'Invalid action. Must be approve, reject, or delete.', 400);
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }
    
    if (!review.reported || !review.reported.isReported) {
      return errorResponse(res, 'This review has not been reported', 400);
    }
    
    if (action === 'delete') {
      // Delete the review
      await review.remove();
      
      // Notify both users
      const notificationMessage = 'A review you were involved with has been removed by an administrator for violating our guidelines.';
      
      await Notification.create({
        recipient: review.from,
        type: 'system-notification',
        title: 'Review Removed',
        message: notificationMessage,
        data: { sender: req.user._id },
      });
      
      await Notification.create({
        recipient: review.to,
        type: 'system-notification',
        title: 'Review Removed',
        message: notificationMessage,
        data: { sender: req.user._id },
      });
      
      return successResponse(res, {
        message: 'Reported review has been deleted',
      });
    } else if (action === 'approve') {
      // Reject the report
      review.reported.isReported = false;
      review.reported.adminNotes = adminNotes || 'Report reviewed and approved by admin';
      await review.save();
      
      // Notify the reviewer
      await Notification.create({
        recipient: review.from,
        type: 'system-notification',
        title: 'Review Report Resolved',
        message: 'A report against your review has been reviewed and the review has been maintained.',
        data: { sender: req.user._id },
      });
      
      // Notify the reporter
      await Notification.create({
        recipient: review.reported.reportedBy,
        type: 'system-notification',
        title: 'Review Report Resolved',
        message: 'Thank you for your report. After careful review, we have determined that the review does not violate our guidelines.',
        data: { sender: req.user._id },
      });
      
      return successResponse(res, {
        message: 'Review report has been approved (rejected)',
      });
    } else {
      // Hide the review but don't delete it
      review.isPublic = false;
      review.reported.isReported = false;
      review.reported.adminNotes = adminNotes || 'Report reviewed and rejected by admin';
      await review.save();
      
      // Notify the reviewer
      await Notification.create({
        recipient: review.from,
        type: 'system-notification',
        title: 'Review Hidden',
        message: 'Your review has been hidden as it was found to violate our community guidelines.',
        data: { sender: req.user._id },
      });
      
      // Notify the reporter
      await Notification.create({
        recipient: review.reported.reportedBy,
        type: 'system-notification',
        title: 'Review Report Resolved',
        message: 'Thank you for your report. After careful review, we have hidden the review as it violated our guidelines.',
        data: { sender: req.user._id },
      });
      
      return successResponse(res, {
        message: 'Review has been hidden and report resolved',
      });
    }
  } catch (error) {
    console.error('Handle reported review error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Create a system notification
 * @route   POST /api/admin/notifications
 * @access  Private/Admin
 */
export const createSystemNotification = async (req, res) => {
  try {
    const { recipients, title, message, url } = req.body;
    
    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', 400);
    }
    
    // Handle different recipient types
    let userIds = [];
    
    if (recipients === 'all') {
      // Get all active users
      const users = await User.find({ isActive: true }).select('_id');
      userIds = users.map(user => user._id);
    } else if (recipients === 'clients') {
      // Get all active clients
      const clients = await User.find({ isActive: true, role: 'client' }).select('_id');
      userIds = clients.map(client => client._id);
    } else if (recipients === 'freelancers') {
      // Get all active freelancers
      const freelancers = await User.find({ isActive: true, role: 'freelancer' }).select('_id');
      userIds = freelancers.map(freelancer => freelancer._id);
    } else if (Array.isArray(recipients)) {
      // Specific user IDs
      userIds = recipients;
    } else {
      return errorResponse(res, 'Invalid recipients parameter', 400);
    }
    
    // Create notifications for all recipients
    const notificationPromises = userIds.map(userId =>
      Notification.create({
        recipient: userId,
        type: 'system-notification',
        title,
        message,
        data: {
          sender: req.user._id,
          url,
        },
      })
    );
    
    await Promise.all(notificationPromises);
    
    return successResponse(res, {
      message: `Notification sent to ${userIds.length} users`,
    });
  } catch (error) {
    console.error('Create system notification error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Create category
 * @route   POST /api/admin/categories
 * @access  Private/Admin
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon, parent, sortOrder } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return errorResponse(res, 'Category with this name already exists', 400);
    }
    
    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
    
    // Check if parent category exists
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return errorResponse(res, 'Parent category not found', 404);
      }
    }
    
    // Create new category
    const category = await Category.create({
      name,
      slug,
      description,
      icon: icon || 'fa-briefcase',
      parent: parent || null,
      isActive: true,
      sortOrder: sortOrder || 0,
    });
    
    return successResponse(res, {
      category,
      message: 'Category created successfully',
    }, 201);
  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/admin/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, parent, isActive, sortOrder } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }
    
    // If name is changing, check for duplicates
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return errorResponse(res, 'Category with this name already exists', 400);
      }
      
      // Update slug if name changes
      category.slug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    }
    
    // Check if parent category exists and is not self
    if (parent) {
      if (parent === req.params.id) {
        return errorResponse(res, 'Category cannot be its own parent', 400);
      }
      
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return errorResponse(res, 'Parent category not found', 404);
      }
    }
    
    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (parent !== undefined) category.parent = parent || null;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    
    await category.save();
    
    return successResponse(res, {
      category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Update category error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/admin/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }
    
    // Check if category has subcategories
    const subcategories = await Category.countDocuments({ parent: req.params.id });
    if (subcategories > 0) {
      return errorResponse(res, 'Cannot delete category with subcategories. Move or delete subcategories first.', 400);
    }
    
    // Check if category is used in jobs
    const jobsWithCategory = await Job.countDocuments({ category: req.params.id });
    if (jobsWithCategory > 0) {
      return errorResponse(res, `Cannot delete category used by ${jobsWithCategory} jobs. Consider deactivating instead.`, 400);
    }
    
    // Delete category
    await category.remove();
    
    return successResponse(res, {
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get all jobs with advanced filtering for admin
 * @route   GET /api/admin/jobs
 * @access  Private/Admin
 */
export const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query with filters
    const query = {};
    
    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Date range
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
      query.createdAt = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.createdAt = { $lte: new Date(req.query.endDate) };
    }
    
    // Search by title or description
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    
    // Client filter
    if (req.query.client) {
      query.client = req.query.client;
    }
    
    // Budget range
    if (req.query.minBudget || req.query.maxBudget) {
      query.budget = {};
      
      if (req.query.minBudget) {
        query.budget['budget.minAmount'] = { $gte: parseInt(req.query.minBudget) };
      }
      
      if (req.query.maxBudget) {
        query.budget['budget.maxAmount'] = { $lte: parseInt(req.query.maxBudget) };
      }
    }
    
    // Count total matching jobs
    const totalJobs = await Job.countDocuments(query);
    
    // Build sort options
    let sortOptions = {};
    
    if (req.query.sort) {
      try {
        sortOptions = JSON.parse(req.query.sort);
      } catch (e) {
        sortOptions = { createdAt: -1 };
      }
    } else {
      // Default sort by newest
      sortOptions = { createdAt: -1 };
    }
    
    // Fetch jobs
    const jobs = await Job.find(query)
      .populate('client', 'firstName lastName email')
      .populate('category', 'name')
      .populate('hiredFreelancer', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);
    
    return successResponse(res, {
      jobs,
      page,
      limit,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get all payments with advanced filtering for admin
 * @route   GET /api/admin/payments
 * @access  Private/Admin
 */
export const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query with filters
    const query = {};
    
    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Payment method filter
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }
    
    // Date range
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
      query.createdAt = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.createdAt = { $lte: new Date(req.query.endDate) };
    }
    
    // Amount range
    if (req.query.minAmount || req.query.maxAmount) {
      query.amount = {};
      
      if (req.query.minAmount) {
        query.amount.$gte = parseInt(req.query.minAmount);
      }
      
      if (req.query.maxAmount) {
        query.amount.$lte = parseInt(req.query.maxAmount);
      }
    }
    
    // Client or freelancer filter
    if (req.query.client) {
      query.client = req.query.client;
    }
    
    if (req.query.freelancer) {
      query.freelancer = req.query.freelancer;
    }
    
    // Count total matching payments
    const totalPayments = await Payment.countDocuments(query);
    
    // Build sort options
    let sortOptions = {};
    
    if (req.query.sort) {
      try {
        sortOptions = JSON.parse(req.query.sort);
      } catch (e) {
        sortOptions = { createdAt: -1 };
      }
    } else {
      // Default sort by newest
      sortOptions = { createdAt: -1 };
    }
    
    // Fetch payments
    const payments = await Payment.find(query)
      .populate('client', 'firstName lastName email')
      .populate('freelancer', 'firstName lastName email')
      .populate('job', 'title')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);
    
    return successResponse(res, {
      payments,
      page,
      limit,
      totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    return errorResponse(res, error.message, 500);
  }
};


/**
 * @desc    Get all client verification requests
 * @route   GET /api/admin/verification-requests
 * @access  Private/Admin
 */
export const getAllClientVerificationRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query with filters
    const query = { 'clientVerification.status': 'pending' };

    // Filter by role if provided
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Count total matching requests
    const totalRequests = await User.countDocuments(query);

    // Fetch requests
    const requests = await User.find(query)
      .select('name email role clientVerification createdAt')
      .skip(skip)
      .limit(limit)
      .sort(req.query.sort ? JSON.parse(req.query.sort) : { 'clientVerification.submittedAt': -1 });

    // Format the response
    const formattedRequests = requests.map(user => ({
      _id: user._id,
      name: `${user.name}`,
      email: user.email,
      role: user.role,
      verificationMethod: user.clientVerification.method,
      dateSubmitted: user.clientVerification.submittedAt || user.createdAt,
      document: user.clientVerification.document,
    }));

    return successResponse(res, {
      requests: formattedRequests,
      page,
      limit,
      totalRequests,
      totalPages: Math.ceil(totalRequests / limit),
    });
  } catch (error) {
    console.error('Get all client verification requests error:', error);
    return errorResponse(res, error.message, 500);
  }
};


export const handleClientVerification = async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body;

  const user = await User.findById(userId);

  if (!user || !user.clientVerification) {
    res.status(404);
    throw new Error('User not found or no verification pending');
  }

  if (!['approve', 'reject'].includes(action)) {
    res.status(400);
    throw new Error('Invalid action');
  }

  user.clientVerification.status = action === 'approve' ? 'verified' : 'rejected';
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Client Verification Update',
    text: `Your verification request has been ${user.clientVerification.status}.`,
  });

  res.status(200).json({ message: `Client verification ${user.clientVerification.status}` });
};

/**
 * @desc    Get recent activities
 * @route   GET /api/admin/activities
 * @access  Private/Admin
 */
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await ActivityLog.getLogs(limit);
    
    return successResponse(res, {
      activities,
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get recent users
 * @route   GET /api/admin/recent-users
 * @access  Private/Admin
 */
export const getRecentUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const recentUsers = await User.find()
      .select('name email role isActive isEmailVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    const formattedUsers = recentUsers.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      joined: user.createdAt.toISOString().split('T')[0],
      status: user.isActive ? 'active' : 'inactive',
      avatar: `https://ui-avatars.com/api/?name=${user.name}&background=9333EA&color=fff`,
    }));

    return successResponse(res, { users: formattedUsers });
  } catch (error) {
    console.error('Get recent users error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get activity logs
 * @route   GET /api/admin/activity-logs
 * @access  Private/Admin
 */
export const getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;

    // Create some sample activity logs based on recent system activities
    const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(3).populate('client', 'name');
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(3);
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(2);

    const activities = [];

    // Add job activities
    recentJobs.forEach(job => {
      activities.push({
        id: `job_${job._id}`,
        user: job.client ? job.client.name : 'Unknown User',
        action: `Posted a new project: ${job.title}`,
        timestamp: job.createdAt.toISOString(),
        type: 'project',
      });
    });

    // Add user registration activities
    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user._id}`,
        user: user.name,
        action: `Registered as ${user.role}`,
        timestamp: user.createdAt.toISOString(),
        type: 'user',
      });
    });

    // Add payment activities
    recentPayments.forEach(payment => {
      activities.push({
        id: `payment_${payment._id}`,
        user: 'System',
        action: `Payment processed: $${payment.amount}`,
        timestamp: payment.createdAt.toISOString(),
        type: 'payment',
      });
    });

    // Add some system activities
    activities.push({
      id: 'system_1',
      user: 'System',
      action: 'Automatic backup completed successfully',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      type: 'system',
    });

    activities.push({
      id: 'admin_1',
      user: 'Admin',
      action: 'Updated platform terms and conditions',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      type: 'admin',
    });

    // Sort by timestamp (newest first) and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return successResponse(res, { logs: sortedActivities });
  } catch (error) {
    console.error('Get activity logs error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get platform status
 * @route   GET /api/admin/platform-status
 * @access  Private/Admin
 */
export const getPlatformStatus = async (req, res) => {
  try {
    // Calculate platform health metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: { $in: ['open', 'in-progress'] } });
    
    const userUptime = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 100;
    const jobUptime = totalJobs > 0 ? Math.round((activeJobs / totalJobs) * 100) : 100;
    
    const status = {
      server: {
        status: 'operational',
        uptime: 99.9,
        responseTime: Math.floor(Math.random() * 50) + 20, // Simulated response time
      },
      database: {
        status: 'operational',
        uptime: 99.8,
        responseTime: Math.floor(Math.random() * 30) + 10,
      },
      users: {
        status: userUptime > 80 ? 'operational' : userUptime > 60 ? 'degraded' : 'outage',
        uptime: userUptime,
        activeCount: activeUsers,
      },
      jobs: {
        status: jobUptime > 70 ? 'operational' : jobUptime > 50 ? 'degraded' : 'outage',
        uptime: jobUptime,
        activeCount: activeJobs,
      },
      payments: {
        status: 'operational',
        uptime: 99.5,
        responseTime: Math.floor(Math.random() * 40) + 15,
      },
    };

    return successResponse(res, status);
  } catch (error) {
    console.error('Get platform status error:', error);
    return errorResponse(res, error.message, 500);
  }
};
