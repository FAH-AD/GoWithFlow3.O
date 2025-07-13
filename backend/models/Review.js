import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: {
        values: ['client-to-freelancer', 'freelancer-to-client'],
        message: 'Type must be client-to-freelancer or freelancer-to-client',
      },
      required: [true, 'Type is required'],
    },
    // Additional rating categories for detailed feedback
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    qualityOfWork: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },
    expertise: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Helpful votes from other users
    helpfulVotes: {
      type: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      }],
      default: [],
    },
    // Reports for inappropriate content
    reports: {
      type: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: {
          type: String,
          required: true,
          enum: {
            values: [
              'inappropriate-content',
              'false-information',
              'harassment',
              'spam',
              'other',
            ],
            message: 'Reason must be a valid option',
          },
        },
        description: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: {
            values: ['pending', 'reviewed', 'dismissed'],
            message: 'Status must be pending, reviewed, or dismissed',
          },
          default: 'pending',
        },
      }],
      default: [],
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      trim: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reportedAt: {
      type: Date,
    },
    // For admin moderation
    isHidden: {
      type: Boolean,
      default: false,
    },
    moderationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
reviewSchema.index({ job: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ recipient: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ type: 1 });
reviewSchema.index({ createdAt: -1 });

// Unique compound index to prevent duplicate reviews
// One review per job per reviewer-recipient pair
reviewSchema.index({ job: 1, reviewer: 1, recipient: 1 }, { unique: true });

// Static method: Get average rating for a user
reviewSchema.statics.getAverageRating = async function (userId) {
  try {
    const result = await this.aggregate([
      {
        $match: { recipient: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$recipient',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return result.length > 0
      ? {
          averageRating: Math.round(result[0].averageRating * 10) / 10,
          totalReviews: result[0].totalReviews,
        }
      : { averageRating: 0, totalReviews: 0 };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return { averageRating: 0, totalReviews: 0 };
  }
};

// Static method: Get review statistics for a user
reviewSchema.statics.getReviewStats = async function (userId) {
  try {
    const result = await this.aggregate([
      {
        $match: { recipient: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$recipient',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          avgCommunication: { $avg: '$communication' },
          avgQualityOfWork: { $avg: '$qualityOfWork' },
          avgValueForMoney: { $avg: '$valueForMoney' },
          avgExpertise: { $avg: '$expertise' },
          avgProfessionalism: { $avg: '$professionalism' },
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

    return result.length > 0
      ? {
          averageRating: Math.round(result[0].averageRating * 10) / 10,
          totalReviews: result[0].totalReviews,
          categoryAverages: {
            communication: Math.round((result[0].avgCommunication || 0) * 10) / 10,
            qualityOfWork: Math.round((result[0].avgQualityOfWork || 0) * 10) / 10,
            valueForMoney: Math.round((result[0].avgValueForMoney || 0) * 10) / 10,
            expertise: Math.round((result[0].avgExpertise || 0) * 10) / 10,
            professionalism: Math.round((result[0].avgProfessionalism || 0) * 10) / 10,
          },
          ratingDistribution: {
            fiveStar: result[0].fiveStarCount,
            fourStar: result[0].fourStarCount,
            threeStar: result[0].threeStarCount,
            twoStar: result[0].twoStarCount,
            oneStar: result[0].oneStarCount,
          },
        }
      : {
          averageRating: 0,
          totalReviews: 0,
          categoryAverages: {
            communication: 0,
            qualityOfWork: 0,
            valueForMoney: 0,
            expertise: 0,
            professionalism: 0,
          },
          ratingDistribution: {
            fiveStar: 0,
            fourStar: 0,
            threeStar: 0,
            twoStar: 0,
            oneStar: 0,
          },
        };
  } catch (error) {
    console.error('Error calculating review stats:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      categoryAverages: {
        communication: 0,
        qualityOfWork: 0,
        valueForMoney: 0,
        expertise: 0,
        professionalism: 0,
      },
      ratingDistribution: {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    };
  }
};

export default mongoose.model('Review', reviewSchema);