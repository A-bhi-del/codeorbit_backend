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

      return next();

    } catch (firebaseError) {

      // 2️⃣ If Firebase fails → try JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = decoded.userId;

      return next();

    }

  } catch (err) {

    return res.status(401).json({
      message: "Invalid token"
    });

  }

};