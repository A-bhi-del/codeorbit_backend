/**
 * Migration script to fix friends array - Only mutual followers
 * Friends = Users who are in BOTH followers AND following arrays
 * Run with: node fix-mutual-friends.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const fixMutualFriends = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({})
      .select('email displayName username followers following friends');

    console.log(`📊 Found ${users.length} users\n`);

    let updatedCount = 0;

    for (const user of users) {
      console.log(`\n👤 Processing: ${user.displayName || user.username || user.email}`);
      console.log(`   Current state:`);
      console.log(`   - Followers: ${user.followers?.length || 0}`);
      console.log(`   - Following: ${user.following?.length || 0}`);
      console.log(`   - Friends (old): ${user.friends?.length || 0}`);

      // Find mutual friends - users in BOTH followers AND following
      const followerIds = new Set(user.followers.map(id => id.toString()));
      const mutualFriendIds = user.following
        .filter(followingId => followerIds.has(followingId.toString()))
        .map(id => id.toString());

      console.log(`   - Mutual friends (calculated): ${mutualFriendIds.length}`);

      // Update friends array to only contain mutual friends
      const oldFriendsCount = user.friends?.length || 0;
      user.friends = mutualFriendIds.map(id => new mongoose.Types.ObjectId(id));
      
      if (oldFriendsCount !== mutualFriendIds.length) {
        await user.save();
        updatedCount++;
        console.log(`   ✅ Updated! Friends: ${oldFriendsCount} → ${mutualFriendIds.length}`);
        
        if (mutualFriendIds.length > 0) {
          console.log(`   Mutual friends IDs:`, mutualFriendIds);
        }
      } else {
        console.log(`   ⏭️  No changes needed`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total users processed: ${users.length}`);
    console.log(`   Users updated: ${updatedCount}`);
    console.log('='.repeat(60));

    // Show final state with populated friends
    console.log('\n📋 Final State (Users with mutual friends):');
    const usersWithFriends = await User.find({
      friends: { $exists: true, $ne: [] }
    })
    .select('email displayName username friends followers following')
    .populate('friends', 'email displayName username')
    .populate('followers', 'email displayName username')
    .populate('following', 'email displayName username');

    if (usersWithFriends.length === 0) {
      console.log('\n❌ No users have mutual friends yet.');
      console.log('💡 Mutual friends = Users who follow each other (both ways)');
    } else {
      for (const user of usersWithFriends) {
        console.log(`\n👤 ${user.displayName || user.username || user.email}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Followers: ${user.followers?.length || 0}`);
        console.log(`   Following: ${user.following?.length || 0}`);
        console.log(`   Mutual Friends: ${user.friends?.length || 0}`);
        
        if (user.friends && user.friends.length > 0) {
          console.log('   Friend list (mutual):');
          user.friends.forEach(friend => {
            console.log(`     - ${friend.displayName || friend.username || friend.email}`);
          });
        }

        // Show who they follow but aren't friends with
        const friendIds = new Set(user.friends.map(f => f._id.toString()));
        const nonMutualFollowing = user.following.filter(f => !friendIds.has(f._id.toString()));
        if (nonMutualFollowing.length > 0) {
          console.log('   Following (not mutual):');
          nonMutualFollowing.forEach(f => {
            console.log(`     - ${f.displayName || f.username || f.email} (doesn't follow back)`);
          });
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 How it works now:');
    console.log('   - Friends = Only mutual followers (both follow each other)');
    console.log('   - Following = People you follow');
    console.log('   - Followers = People who follow you');
    console.log('\n📱 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Go to Social page → Friends tab');
    console.log('   3. You will only see mutual friends!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the migration
fixMutualFriends();
