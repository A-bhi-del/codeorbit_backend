import Notification from "../models/Notification.js";

// Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user;
    const { limit = 50, skip = 0 } = req.query;

    const notifications = await Notification.find({ receiver: userId })
      .populate('sender', 'displayName username photoURL profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const unreadCount = await Notification.countDocuments({
      receiver: userId,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, receiver: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ notification });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user;

    await Notification.updateMany(
      { receiver: userId, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      receiver: userId
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user;

    const count = await Notification.countDocuments({
      receiver: userId,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
