import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Response message is required'],
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  attachments: [{
    name: String,
    url: String,
    mimeType: String,
  }],
});

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Issue category is required'],
      enum: [
        'technical',
        'payment',
        'account',
        'job_posting',
        'freelancer_issues',
        'client_issues',
        'billing',
        'verification',
        'other'
      ],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    attachments: [{
      name: String,
      url: String,
      mimeType: String,
    }],
    responses: [responseSchema],
    metadata: {
      browser: String,
      operatingSystem: String,
      device: String,
      ipAddress: String,
      userAgent: String,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    relatedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    internalNotes: [{
      note: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    resolution: {
      summary: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: Date,
      resolution: String,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    viewedByUser: {
      type: Boolean,
      default: false,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: Date,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
issueSchema.index({ submittedBy: 1, status: 1 });
issueSchema.index({ status: 1, priority: 1 });
issueSchema.index({ assignedTo: 1, status: 1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ lastActivityAt: -1 });

// Virtual for response count
issueSchema.virtual('responseCount').get(function() {
  return this.responses ? this.responses.length : 0;
});

// Virtual for days since creation
issueSchema.virtual('daysSinceCreation').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for last response
issueSchema.virtual('lastResponse').get(function() {
  if (this.responses && this.responses.length > 0) {
    return this.responses[this.responses.length - 1];
  }
  return null;
});

// Pre-save middleware to update lastActivityAt
issueSchema.pre('save', function(next) {
  if (this.isModified('responses') || this.isModified('status')) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Static method to get issue statistics
issueSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await this.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 },
      },
    },
  ]);

  const categoryStats = await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    statusStats: stats,
    priorityStats: priorityStats,
    categoryStats: categoryStats,
  };
};

// Instance method to add response
issueSchema.methods.addResponse = function(responseData) {
  this.responses.push(responseData);
  this.lastActivityAt = new Date();
  
  // If this is a response from admin/support, mark as viewed by admin
  if (responseData.author && responseData.authorRole === 'admin') {
    this.viewedByUser = false; // User needs to view the new response
  }
  
  return this.save();
};

// Instance method to update status
issueSchema.methods.updateStatus = function(newStatus, userId = null) {
  this.status = newStatus;
  this.lastActivityAt = new Date();
  
  if (newStatus === 'resolved' && userId) {
    this.resolution = {
      ...this.resolution,
      resolvedBy: userId,
      resolvedAt: new Date(),
    };
  }
  
  return this.save();
};

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
