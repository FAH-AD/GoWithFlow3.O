/**
 * Debug script to check reviews in database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

dotenv.config();

const checkReviews = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/gowithflow';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Check total reviews
    const totalReviews = await Review.countDocuments();
    console.log(`\n📊 Total reviews in database: ${totalReviews}`);

    if (totalReviews === 0) {
      console.log('❌ No reviews found in database!');
      return;
    }

    // Get first few reviews
    const reviews = await Review.find({})
      .populate('reviewer', 'firstName lastName')
      .populate('recipient', 'firstName lastName')
      .populate('job', 'title')
      .limit(5)
      .sort({ createdAt: -1 });

    console.log('\n🔍 Recent reviews:');
    reviews.forEach((review, index) => {
      console.log(`\n${index + 1}. Review ID: ${review._id}`);
      console.log(`   Job: ${review.job?.title || 'N/A'} (${review.job?._id || 'No job ID'})`);
      console.log(`   Reviewer: ${review.reviewer?.firstName} ${review.reviewer?.lastName} (${review.reviewer?._id || 'No reviewer ID'})`);
      console.log(`   Recipient: ${review.recipient?.firstName} ${review.recipient?.lastName} (${review.recipient?._id || 'No recipient ID'})`);
      console.log(`   Rating: ${review.rating}/5`);
      console.log(`   Type: ${review.type}`);
      console.log(`   Public: ${review.isPublic}`);
      console.log(`   Created: ${review.createdAt}`);
    });

    // Check for any reviews with missing data
    const invalidReviews = await Review.find({
      $or: [
        { job: null },
        { reviewer: null },
        { recipient: null },
        { job: { $exists: false } },
        { reviewer: { $exists: false } },
        { recipient: { $exists: false } }
      ]
    });

    if (invalidReviews.length > 0) {
      console.log(`\n⚠️  Found ${invalidReviews.length} reviews with missing data:`);
      invalidReviews.forEach(review => {
        console.log(`   - Review ${review._id}: job=${review.job}, reviewer=${review.reviewer}, recipient=${review.recipient}`);
      });
    }

    // Check specific user's reviews
    const users = await User.find({}).limit(3);
    if (users.length > 0) {
      console.log('\n👥 Checking reviews for sample users:');
      for (const user of users) {
        const userReviews = await Review.countDocuments({ recipient: user._id });
        console.log(`   - ${user.firstName} ${user.lastName} (${user._id}): ${userReviews} reviews`);
      }
    }

    // Check completed jobs
    const completedJobs = await Job.find({ status: 'completed' }).limit(5);
    console.log(`\n✅ Found ${completedJobs.length} completed jobs`);
    
    for (const job of completedJobs) {
      const jobReviews = await Review.countDocuments({ job: job._id });
      console.log(`   - Job "${job.title}" (${job._id}): ${jobReviews} reviews`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
};

checkReviews();
