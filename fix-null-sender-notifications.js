import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';
import User from './models/User.js';

dotenv.config();

const fixNullSenderNotifications = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all notifications with null sender
    const nullSenderNotifications = await Notification.find({ sender: null });
    console.log(`\nFound ${nullSenderNotifications.length} notifications with null sender`);

    if (nullSenderNotifications.length > 0) {
      console.log('\nDeleting notifications with null sender...');
      const result = await Notification.deleteMany({ sender: null });
      console.log(`✅ Deleted ${result.deletedCount} notifications`);
    } else {
      console.log('✅ No notifications with null sender found');
    }

    // Also check for notifications where sender is not populated
    const allNotifications = await Notification.find().populate('sender');
    let invalidCount = 0;
    const invalidIds = [];

    for (const notification of allNotifications) {
      if (!notification.sender) {
        invalidCount++;
        invalidIds.push(notification._id);
      }
    }

    if (invalidCount > 0) {
      console.log(`\nFound ${invalidCount} notifications with invalid sender references`);
      console.log('Deleting invalid notifications...');
      const result = await Notification.deleteMany({ _id: { $in: invalidIds } });
      console.log(`✅ Deleted ${result.deletedCount} invalid notifications`);
    } else {
      console.log('✅ All notifications have valid sender references');
    }

    console.log('\n✅ Database cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixNullSenderNotifications();
