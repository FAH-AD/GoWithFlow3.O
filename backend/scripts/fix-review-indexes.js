/**
 * MongoDB Index Fix Script for Reviews Collection
 * 
 * This script fixes the duplicate key error by:
 * 1. Dropping the problematic legacy index (from_1_to_1_project_1)
 * 2. Cleaning up any invalid documents
 * 3. Creating the correct unique index
 * 
 * Run this script ONLY when you have access to MongoDB.
 * 
 * Instructions:
 * 1. Make sure MongoDB is running
 * 2. Update the MONGODB_URL in your environment or modify the connection string below
 * 3. Run: node scripts/fix-review-indexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixReviewIndexes = async () => {
  try {
    // Update this connection string to match your MongoDB setup
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/gowithflow';
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('reviews');

    // Step 1: List current indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Step 2: Drop problematic indexes
    console.log('\n🧹 Cleaning problematic indexes...');
    let droppedCount = 0;
    
    for (const idx of indexes) {
      // Drop indexes that reference old fields (from, to, project)
      if (idx.name.includes('from_1_to_1_project_1') || 
          idx.name.includes('from') || 
          idx.name.includes('to') || 
          idx.name.includes('project')) {
        try {
          await collection.dropIndex(idx.name);
          console.log(`  ✅ Dropped problematic index: ${idx.name}`);
          droppedCount++;
        } catch (error) {
          console.log(`  ⚠️  Could not drop index ${idx.name}: ${error.message}`);
        }
      }
    }
    
    if (droppedCount === 0) {
      console.log('  ℹ️  No problematic indexes found');
    }

    // Step 3: Clean up invalid documents
    console.log('\n🧽 Cleaning invalid documents...');
    const deleteResult = await collection.deleteMany({
      $or: [
        { job: null },
        { reviewer: null },
        { recipient: null },
        { job: { $exists: false } },
        { reviewer: { $exists: false } },
        { recipient: { $exists: false } }
      ]
    });
    console.log(`  ✅ Removed ${deleteResult.deletedCount} invalid documents`);

    // Step 4: Create proper unique index
    console.log('\n🔧 Creating proper unique index...');
    try {
      await collection.createIndex(
        { job: 1, reviewer: 1, recipient: 1 }, 
        { 
          unique: true, 
          name: 'job_reviewer_recipient_unique',
          background: true
        }
      );
      console.log('  ✅ Created unique index: job_reviewer_recipient_unique');
    } catch (error) {
      if (error.code === 11000) {
        console.log('  ⚠️  Index already exists or there are duplicate documents');
        
        // Find and report duplicates
        console.log('\n🔍 Checking for duplicate reviews...');
        const duplicates = await collection.aggregate([
          {
            $group: {
              _id: { job: '$job', reviewer: '$reviewer', recipient: '$recipient' },
              count: { $sum: 1 },
              docs: { $push: '$_id' }
            }
          },
          {
            $match: { count: { $gt: 1 } }
          }
        ]).toArray();
        
        if (duplicates.length > 0) {
          console.log(`  ⚠️  Found ${duplicates.length} sets of duplicate reviews:`);
          for (const dup of duplicates) {
            console.log(`    Job: ${dup._id.job}, Reviewer: ${dup._id.reviewer}, Recipient: ${dup._id.recipient}`);
            console.log(`    Document IDs: ${dup.docs.join(', ')}`);
            
            // Remove duplicates, keep the first one
            const toDelete = dup.docs.slice(1);
            if (toDelete.length > 0) {
              await collection.deleteMany({ _id: { $in: toDelete } });
              console.log(`    ✅ Removed ${toDelete.length} duplicate(s)`);
            }
          }
          
          // Try creating the index again
          try {
            await collection.createIndex(
              { job: 1, reviewer: 1, recipient: 1 }, 
              { 
                unique: true, 
                name: 'job_reviewer_recipient_unique',
                background: true
              }
            );
            console.log('  ✅ Successfully created unique index after cleanup');
          } catch (retryError) {
            console.log(`  ❌ Still couldn't create index: ${retryError.message}`);
          }
        }
      } else {
        console.log(`  ❌ Error creating index: ${error.message}`);
      }
    }

    // Step 5: List final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (UNIQUE)' : ''}`);
    });

    console.log('\n🎉 Review indexes fix completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error fixing review indexes:', error.message);
    console.error('Full error:', error);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\n📤 Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError.message);
    }
  }
};

// Show usage if no MongoDB URL is provided
if (!process.env.MONGODB_URL) {
  console.log('⚠️  Warning: No MONGODB_URL environment variable found.');
  console.log('The script will try to connect to: mongodb://localhost:27017/gowithflow');
  console.log('Update the connection string in this file if needed.\n');
}

// Run the fix
console.log('🚀 Starting Review Indexes Fix...\n');
fixReviewIndexes().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
