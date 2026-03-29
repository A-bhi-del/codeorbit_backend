import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { admin } from "../config/firebase.js";

// Signup
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      provider: 'local'
    });

    res.status(201).json({ message: "Signup successful" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Firebase Google Authentication
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user exists
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Create new user
      user = await User.create({
        email: decodedToken.email,
        firebaseUid: decodedToken.uid,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        provider: 'google'
      });
    } else {
      // Update user info if needed
      user.displayName = decodedToken.name;
      user.photoURL = decodedToken.picture;
      await user.save();
    }

    res.json({
      message: "Google authentication successful",
      token: idToken, // Use Firebase token directly
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider
      }
    });

  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        platforms: {
          leetcode: user.leetcode,
          codeforces: user.codeforces,
          github: user.github,
          codechef: user.codechef,
          gfg: user.gfg
        }
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};