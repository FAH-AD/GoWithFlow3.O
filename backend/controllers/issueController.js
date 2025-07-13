import Issue from '../models/Issue.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { sendEmail } from '../utils/sendEmail.js';

/**
 * @desc    Create a new issue
 * @route   POST /api/issues
 * @access  Private
 */
export const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority = 'medium',
      relatedJob,
      relatedPayment,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return errorResponse(res, 400, 'Title, description, and category are required');
    }

    // Extract metadata from request
    const metadata = {
      browser: req.get('User-Agent')?.split(' ')[0] || 'Unknown',
      userAgent: req.get('User-Agent') || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    };

    // Handle file attachments
    const attachments = req.files ? req.files.map(file => ({
      name: file.originalname,
      url: file.path,
      mimeType: file.mimetype,
    })) : [];

    // Create the issue
    const issue = await Issue.create({
      title,
      description,
      category,
      priority,
      submittedBy: req.user._id,
      attachments,
      metadata,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      relatedJob: relatedJob || null,
      relatedPayment: relatedPayment || null,
    });

    // Populate the issue with user details
    await issue.populate('submittedBy', 'name email role');

    // Notify all admins about the new issue
    const admins = await User.find({ role: 'admin', isActive: true });
    
    const notificationPromises = admins.map(admin => 
      Notification.create({
        recipient: admin._id,
        type: 'system-notification',
        title: 'New Support Issue',
        message: `A new ${category} issue has been submitted: "${title}"`,
        data: {
          issue: issue._id,
          sender: req.user._id,
          category,
          priority,
        },
      })
    );

    await Promise.all(notificationPromises);

    // Send email notification to admins for high priority or urgent issues
    if (priority === 'high' || priority === 'urgent') {
      const emailPromises = admins.map(admin =>
        sendEmail({
          to: admin.email,
          subject: `${priority.toUpperCase()} Priority Issue: ${title}`,
          html: `
            <h3>${priority.toUpperCase()} Priority Support Issue</h3>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Submitted by:</strong> ${req.user.name} (${req.user.email})</p>
            <p><strong>Description:</strong></p>
            <p>${description}</p>
            <p>Please log in to the admin dashboard to view and respond to this issue.</p>
          `,
        }).catch(err => console.error('Failed to send email notification:', err))
      );

      await Promise.all(emailPromises);
    }

    return successResponse(res, 201, 'Issue created successfully', {
      issue,
    });
  } catch (error) {
    console.error('Create issue error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get all issues for the current user
 * @route   GET /api/issues/my-issues
 * @access  Private
 */
export const getMyIssues = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 10,
      sortBy = 'lastActivityAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = { submittedBy: req.user._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

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
      .populate('assignedTo', 'name email')
      .populate('responses.author', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, 'User issues retrieved successfully', {
      issues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
      },
    });
  } catch (error) {
    console.error('Get my issues error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get issue by ID
 * @route   GET /api/issues/:id
 * @access  Private
 */
export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('responses.author', 'name email role')
      .populate('relatedJob', 'title status')
      .populate('relatedPayment', 'amount status');

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }

    // Check if user has permission to view this issue
    const isOwner = issue.submittedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssigned = issue.assignedTo && issue.assignedTo._id.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isAssigned) {
      return errorResponse(res, 403, 'Not authorized to view this issue');
    }

    // Mark as viewed by user if they're the owner
    if (isOwner && !issue.viewedByUser) {
      issue.viewedByUser = true;
      await issue.save();
    }

    return successResponse(res, 200, 'Issue retrieved successfully', { issue });
  } catch (error) {
    console.error('Get issue by ID error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Add response to an issue
 * @route   POST /api/issues/:id/responses
 * @access  Private
 */
export const addResponse = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return errorResponse(res, 400, 'Response message is required');
    }

    const issue = await Issue.findById(req.params.id)
      .populate('submittedBy', 'name email role');

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }

    // Check permissions
    const isOwner = issue.submittedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssigned = issue.assignedTo && issue.assignedTo._id.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isAssigned) {
      return errorResponse(res, 403, 'Not authorized to respond to this issue');
    }

    // Handle file attachments
    const attachments = req.files ? req.files.map(file => ({
      name: file.originalname,
      url: file.path,
      mimeType: file.mimetype,
    })) : [];

    // Add the response
    const responseData = {
      message: message.trim(),
      author: req.user._id,
      attachments,
    };

    issue.responses.push(responseData);
    issue.lastActivityAt = new Date();

    // If this is a user responding to their own issue, mark as unviewed by admin
    if (isOwner) {
      issue.viewedByUser = true;
    } else {
      // Admin/support responding, mark as unviewed by user
      issue.viewedByUser = false;
    }

    // If the issue was closed, reopen it when user responds
    if (isOwner && issue.status === 'closed') {
      issue.status = 'open';
    }

    await issue.save();

    // Populate the new response
    await issue.populate('responses.author', 'name email role');

    // Send notification to the other party
    if (isAdmin || isAssigned) {
      // Admin/support responded, notify the user
      await Notification.create({
        recipient: issue.submittedBy._id,
        type: 'system-notification',
        title: 'Response to Your Issue',
        message: `You have received a response to your issue: "${issue.title}"`,
        data: {
          issue: issue._id,
          sender: req.user._id,
        },
      });

      // Send email notification
      await sendEmail({
        to: issue.submittedBy.email,
        subject: `Response to Your Issue: ${issue.title}`,
        html: `
          <h3>Response to Your Support Issue</h3>
          <p><strong>Issue:</strong> ${issue.title}</p>
          <p><strong>Response from:</strong> ${req.user.name}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <p>You can view the full conversation and respond by logging into your account.</p>
        `,
      }).catch(err => console.error('Failed to send email notification:', err));
    } else {
      // User responded, notify admins and assigned user
      const notificationTargets = [];
      
      if (issue.assignedTo) {
        notificationTargets.push(issue.assignedTo);
      } else {
        // Notify all admins if no one is assigned
        const admins = await User.find({ role: 'admin', isActive: true });
        notificationTargets.push(...admins);
      }

      const notificationPromises = notificationTargets.map(target =>
        Notification.create({
          recipient: target._id,
          type: 'system-notification',
          title: 'New Response to Issue',
          message: `${issue.submittedBy.name} has responded to issue: "${issue.title}"`,
          data: {
            issue: issue._id,
            sender: req.user._id,
          },
        })
      );

      await Promise.all(notificationPromises);
    }

    return successResponse(res, 200, 'Response added successfully', {
      response: issue.responses[issue.responses.length - 1],
    });
  } catch (error) {
    console.error('Add response error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Update issue status (Admin only)
 * @route   PUT /api/issues/:id/status
 * @access  Private/Admin
 */
export const updateIssueStatus = async (req, res) => {
  try {
    const { status, resolution, internalNote } = req.body;

    if (!status) {
      return errorResponse(res, 400, 'Status is required');
    }

    const issue = await Issue.findById(req.params.id)
      .populate('submittedBy', 'name email role');

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }

    const oldStatus = issue.status;
    issue.status = status;
    issue.lastActivityAt = new Date();

    // Handle resolution
    if (status === 'resolved' && resolution) {
      issue.resolution = {
        summary: resolution,
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        resolution: resolution,
      };
    }

    // Add internal note if provided
    if (internalNote) {
      issue.internalNotes.push({
        note: internalNote,
        author: req.user._id,
      });
    }

    await issue.save();

    // Notify the user about status change
    await Notification.create({
      recipient: issue.submittedBy._id,
      type: 'system-notification',
      title: 'Issue Status Updated',
      message: `Your issue "${issue.title}" status has been updated to ${status}`,
      data: {
        issue: issue._id,
        oldStatus,
        newStatus: status,
        sender: req.user._id,
      },
    });

    // Send email notification for resolved/closed status
    if (status === 'resolved' || status === 'closed') {
      await sendEmail({
        to: issue.submittedBy.email,
        subject: `Issue ${status}: ${issue.title}`,
        html: `
          <h3>Issue Status Update</h3>
          <p><strong>Issue:</strong> ${issue.title}</p>
          <p><strong>Status:</strong> ${status}</p>
          ${resolution ? `<p><strong>Resolution:</strong> ${resolution}</p>` : ''}
          <p>Thank you for using our support system. If you have any other questions, please don't hesitate to create a new issue.</p>
        `,
      }).catch(err => console.error('Failed to send email notification:', err));
    }

    return successResponse(res, 200, 'Issue status updated successfully', {
      issue,
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Assign issue to admin/support (Admin only)
 * @route   PUT /api/issues/:id/assign
 * @access  Private/Admin
 */
export const assignIssue = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }

    // Validate assignee if provided
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee || assignee.role !== 'admin') {
        return errorResponse(res, 400, 'Assignee must be an admin user');
      }
    }

    issue.assignedTo = assignedTo || null;
    issue.lastActivityAt = new Date();

    await issue.save();

    // Notify the assignee
    if (assignedTo) {
      await Notification.create({
        recipient: assignedTo,
        type: 'system-notification',
        title: 'Issue Assigned to You',
        message: `You have been assigned to handle issue: "${issue.title}"`,
        data: {
          issue: issue._id,
          sender: req.user._id,
        },
      });
    }

    return successResponse(res, 200, assignedTo ? 'Issue assigned successfully' : 'Issue unassigned successfully', {
      issue,
    });
  } catch (error) {
    console.error('Assign issue error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get all issues (Admin only)
 * @route   GET /api/issues/admin/all
 * @access  Private/Admin
 */
export const getAllIssues = async (req, res) => {
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

    return successResponse(res, 200, 'Issues retrieved successfully', {
      issues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
      },
    });
  } catch (error) {
    console.error('Get all issues error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get issue statistics (Admin only)
 * @route   GET /api/issues/admin/stats
 * @access  Private/Admin
 */
export const getIssueStats = async (req, res) => {
  try {
    const stats = await Issue.getStatistics();

    // Get additional stats
    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: 'open' });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const avgResponseTime = await Issue.aggregate([
      {
        $match: {
          responses: { $exists: true, $not: { $size: 0 } },
        },
      },
      {
        $project: {
          responseTime: {
            $subtract: [
              { $arrayElemAt: ['$responses.timestamp', 0] },
              '$createdAt',
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
    ]);

    return successResponse(res, 200, 'Issue statistics retrieved successfully', {
      totalIssues,
      openIssues,
      resolvedIssues,
      resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(2) : 0,
      avgResponseTimeHours: avgResponseTime.length > 0 
        ? Math.round(avgResponseTime[0].avgResponseTime / (1000 * 60 * 60))
        : 0,
      ...stats,
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Update issue priority (Admin only)
 * @route   PUT /api/issues/:id/priority
 * @access  Private/Admin
 */
export const updateIssuePriority = async (req, res) => {
  try {
    const { priority } = req.body;

    if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return errorResponse(res, 400, 'Valid priority is required');
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }

    const oldPriority = issue.priority;
    issue.priority = priority;
    issue.lastActivityAt = new Date();

    await issue.save();

    // Add internal note about priority change
    issue.internalNotes.push({
      note: `Priority changed from ${oldPriority} to ${priority}`,
      author: req.user._id,
    });

    await issue.save();

    return successResponse(res, 200, 'Issue priority updated successfully', {
      issue,
    });
  } catch (error) {
    console.error('Update issue priority error:', error);
    return errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Close issue (User can close their own issue)
 * @route   PUT /api/issues/:id/close
 * @access  Private
 */
export const closeIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }

    // Check permissions
    const isOwner = issue.submittedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Not authorized to close this issue');
    }

    issue.status = 'closed';
    issue.lastActivityAt = new Date();

    await issue.save();

    return successResponse(res, 200, 'Issue closed successfully', {
      issue,
    });
  } catch (error) {
    console.error('Close issue error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export default {
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
};
