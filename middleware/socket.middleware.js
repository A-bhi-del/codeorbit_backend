import jwt from "jsonwebtoken";
import { admin } from "../config/firebase.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Try JWT verification first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      return next();
    } catch (jwtError) {
      // Try Firebase token
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        socket.userId = decodedToken.uid;
        return next();
      } catch (firebaseError) {
        return next(new Error("Authentication error: Invalid token"));
      }
    }
  } catch (error) {
    return next(new Error("Authentication error"));
  }
};
