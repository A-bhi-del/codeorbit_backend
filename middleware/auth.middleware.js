// import jwt from "jsonwebtoken";
// import { admin } from "../config/firebase.js";
// import User from "../models/User.js";

// export const protect = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token)
//     return res.status(401).json({ message: "Not authorized" });

//   try {
//     // Try Firebase token first
//     if (token.length > 100) { // Firebase tokens are typically longer
//       const decodedToken = await admin.auth().verifyIdToken(token);
      
//       // Find or create user based on Firebase UID
//       let user = await User.findOne({ firebaseUid: decodedToken.uid });
      
//       if (!user) {
//         // Create new user from Firebase data
//         user = await User.create({
//           email: decodedToken.email,
//           firebaseUid: decodedToken.uid,
//           displayName: decodedToken.name,
//           photoURL: decodedToken.picture,
//           provider: 'google'
//         });
//       }
      
//       req.user = user._id;
//       req.firebaseUser = decodedToken;
//       next();
//     } else {
//       // Try JWT token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = decoded.userId;
//       next();
//     }
//   } catch (err) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

import jwt from "jsonwebtoken";
import { admin } from "../config/firebase.js";
import User from "../models/User.js";

// Mark the user online. The UI polls notifications every 30s while a page is open, so this stays fresh.
// Throttled to one write per user per 30s.
const lastTouch = new Map();
const touch = (userId) => {
  const key = String(userId);
  const now = Date.now();
  if (now - (lastTouch.get(key) || 0) < 30_000) return;
  lastTouch.set(key, now);
  User.updateOne({ _id: userId }, { $set: { onlineStatus: true, lastSeen: new Date() } }).catch(() => {});
};

export const protect = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({
      message: "Not authorized"
    });

  const token = authHeader.split(" ")[1];

  try {

    // 1️⃣ Try Firebase verification first
    try {

      const decodedToken =
        await admin.auth().verifyIdToken(token);

      let user = await User.findOne({
        firebaseUid: decodedToken.uid
      });

      if (!user) {

        user = await User.create({
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          provider: "google"
        });

      }

      req.user = user._id;
      req.firebaseUser = decodedToken;
      touch(user._id);

      return next();

    } catch (firebaseError) {

      // 2️⃣ If Firebase fails → try JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = decoded.userId;
      touch(decoded.userId);

      return next();

    }

  } catch (err) {

    return res.status(401).json({
      message: "Invalid token"
    });

  }

};

/**
 * Resolve a bearer token (Firebase ID token or the server's own JWT) to a user id, for transports
 * that don't go through Express middleware (Socket.IO). Returns null when the token is invalid.
 */
export const resolveUserId = async (token) => {
  if (!token) return null;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.create({
        email: decodedToken.email,
        firebaseUid: decodedToken.uid,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        provider: "google"
      });
    }
    touch(user._id);
    return String(user._id);
  } catch {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      touch(decoded.userId);
      return String(decoded.userId);
    } catch {
      return null;
    }
  }
};
