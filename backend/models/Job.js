import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const milestoneSchema = new mongoose.Schema({
  title: String,
  description: String,
  amount: Number,
  deadline: Date,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'in-revision','submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalDate: Date
});

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client is required'],
    },
   
    subCategory: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      required: [true, 'Skills are required'],
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [5, 'Budget must be at least $5'],
    },
    deadline: {
      type: Date,
    },
    duration: {
      type: String,
      enum: {
        values: ['less-than-1-month', '1-3-months', '3-6-months', 'more-than-6-months'],
        message: 'Duration must be a valid option',
      },
    },
    experienceLevel: {
      type: String,
      enum: {
        values: ['entry', 'intermediate', 'expert'],
        message: 'Experience level must be entry, intermediate, or expert',
      },
      required: [true, 'Experience level is required'],
    },
    location: {
      type: String,
      enum: {
        values: ['remote', 'on-site', 'hybrid'],
        message: 'Location must be remote, on-site, or hybrid',
      },
      default: 'remote',
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'completed', 'cancelled'],
        message: 'Status must be open, in-progress, completed, or cancelled',
      },
      default: 'open',
    },
    attachments: {
      type: [String],
      default: [],
    },
    bidCount: {
      type: Number,
      default: 0,
    },
    isPromoted: {
      type: Boolean,
      default: false,
    },
    hiredFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hiredBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
    },
    completionDate: {
      type: Date,
    },
    workSubmission: {
      message: {
        type: String,
        trim: true,
      },
      attachments: [
        {
          filename: String,
          url: String,
        }
      ],
      submittedAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['pending_client_review', 'approved', 'revision_requested'],
        default: 'pending_client_review'
      }
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['none', 'escrow', 'released', 'refunded'],
        message: 'Payment status must be none, escrow, released, or refunded',
      },
      default: 'none',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    invitedFreelancers: [{
      freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: {
          values: ['pending', 'accepted', 'declined'],
          message: 'Status must be pending, accepted, or declined',
        },
        default: 'pending',
      },
     
    }],
    offers: [{
      freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      milestoneTitle: String,
      milestoneDescription: String,
      milestoneAmount: Number,
      milestoneDeadline: Date
    }],
    teamOffers: [{
      freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      milestoneTitle: String,
      milestoneDescription: String,
      milestoneAmount: Number,
      milestoneDeadline: Date
    }],
    isCrowdsourced: { type: Boolean, default: false },
    crowdsourcingRoles: [{
      title: String,
      description: String,
      skills: [String],
      budget: Number,
      status: {
        type: String,
        enum: ['open', 'filled'],
        default: 'open'
      }
    }],
    team: [{
      freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
      skills: [String],
      status: { type: String, enum: ['active', 'removed'], default: 'active' },
      joinedAt: { type: Date, default: Date.now },
      removedAt: Date,
      feedback: String,
      milestones: [{
        title: String,
        description: String,
        amount: Number,
        deadline: Date,
        status: { 
          type: String, 
          enum: ['pending', 'in-progress', 'submitted', 'approved', 'rejected', 'paid'], 
          default: 'pending' 
        },
        submission: {
          message: {
            type: String,
            trim: true,
          },
          attachments: [
            {
              filename: String,
              url: String,
            }
          ],
          submittedAt: {
            type: Date,
          },
        },

        submissionDate: Date,
        approvalDate: Date,
        paymentDate: Date,
        feedback: String,
        attachments: [String]
      }]
    }],
    groupConversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    milestones: [milestoneSchema],
    interviewedFreelancers: [{
      freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      lastMessageDate: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ client: 1 });

jobSchema.index({ status: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual field for bids
jobSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'job',
  justOne: false,
  options: { sort: { createdAt: -1 } },
});
jobSchema.plugin(mongoosePaginate);

export default mongoose.model('Job', jobSchema);