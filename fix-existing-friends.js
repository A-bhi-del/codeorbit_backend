/**
 * Migration script to fix existing followers/following relationships
 * This adds users to the friends array based on existing followers/following
 * Run with: node fix-existing-friends.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const fixExistingFriends = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users with followers or following
    const users = await User.find({
      $or: [
        { followers: { $exists: true, $ne: [] } },
        { following: { $exists: true, $ne: [] } }
      ]
    }).select('email displayName username followers following friends');

    console.log(`📊 Found ${users.length} users with followers/following\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      console.log(`\n👤 Processing: ${user.displayName || user.username || user.email}`);
      console.log(`   Current state:`);
      console.log(`   - Followers: ${user.followers?.length || 0}`);
      console.log(`   - Following: ${user.following?.length || 0}`);
      console.log(`   - Friends: ${user.friends?.length || 0}`);

      let needsUpdate = false;
      const newFriends = new Set(user.friends.map(id => id.toString()));

      // Add followers to friends if they're also in following (mutual relationship)
      for (const followerId of user.followers) {
        const followerIdStr = followerId.toString();
        
        // Check if this follower is also someone the user follows
        const isMutual = user.following.some(id => id.toString() === followerIdStr);
        
        if (isMutual && !newFriends.has(followerIdStr)) {
          newFriends.add(followerIdStr);
          needsUpdate = true;
          console.log(`   ✅ Adding mutual friend: ${followerIdStr}`);
        }
      }

      // Also add all following to friends (since they accepted the follow)
      for (const followingId of user.following) {
        const followingIdStr = followingId.toString();
        if (!newFriends.has(followingIdStr)) {
          newFriends.add(followingIdStr);
          needsUpdate = true;
          console.log(`   ✅ Adding following as friend: ${followingIdStr}`);
        }
      }

      if (needsUpdate) {
        user.friends = Array.from(newFriends).map(id => new mongoose.Types.ObjectId(id));
        await user.save();
        updatedCount++;
        console.log(`   ✅ Updated! New friends count: ${user.friends.length}`);
      } else {
        skippedCount++;
        console.log(`   ⏭️  No changes needed`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total users processed: ${users.length}`);
    console.log(`   Users updated: ${updatedCount}`);
    console.log(`   Users skipped: ${skippedCount}`);
    console.log('='.repeat(60));

    // Show final state
    console.log('\n📋 Final State:');
    const updatedUsers = await User.find({
      friends: { $exists: true, $ne: [] }
    })
    .select('email displayName username friends followers following')
    .populate('friends', 'email displayName username');

    for (const user of updatedUsers) {
      console.log(`\n👤 ${user.displayName || user.username || user.email}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Followers: ${user.followers?.length || 0}`);
      console.log(`   Following: ${user.following?.length || 0}`);
      console.log(`   Friends: ${user.friends?.length || 0}`);
      if (user.friends && user.friends.length > 0) {
        console.log('   Friend list:');
        user.friends.forEach(friend => {
          console.log(`     - ${friend.displayName || friend.username || friend.email}`);
        });
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Go to Social page → Friends tab');
    console.log('   3. You should now see your friends!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the migration
fixExistingFriends();
