/**
 * Script to manually set users online for testing ping feature
 * Run with: node set-online-status.js <email> <true|false>
 * Example: node set-online-status.js john@example.com true
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const setOnlineStatus = async () => {
  try {
    const email = process.argv[2];
    const status = process.argv[3] === 'true';

    if (!email) {
      console.log('❌ Usage: node set-online-status.js <email> <true|false>');
      console.log('   Example: node set-online-status.js john@example.com true');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    if (email === 'all') {
      // Set all users online/offline
      const result = await User.updateMany(
        {},
        { 
          onlineStatus: status,
          lastSeen: new Date()
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} users`);
      console.log(`   Online status: ${status ? 'ONLINE' : 'OFFLINE'}`);
    } else {
      // Set specific user online/offline
      const user = await User.findOne({ email });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        process.exit(1);
      }

      user.onlineStatus = status;
      user.lastSeen = new Date();
      await user.save();

      console.log(`✅ Updated user: ${user.displayName || user.username || user.email}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Online status: ${status ? '🟢 ONLINE' : '⚫ OFFLINE'}`);
      console.log(`   Last seen: ${user.lastSeen}`);
    }

    // Show all users with their online status
    console.log('\n📊 All Users Status:');
    console.log('='.repeat(60));
    
    const allUsers = await User.find({})
      .select('email displayName username onlineStatus lastSeen')
      .sort({ onlineStatus: -1, displayName: 1 });

    allUsers.forEach((user, index) => {
      const statusIcon = user.onlineStatus ? '🟢' : '⚫';
      const statusText = user.onlineStatus ? 'ONLINE' : 'OFFLINE';
      console.log(`${index + 1}. ${statusIcon} ${user.displayName || user.username || user.email}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${statusText}`);
      console.log(`   Last seen: ${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('✅ Done!');
    console.log('\n💡 Tip: Refresh your browser to see updated online status');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
setOnlineStatus();
