import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { initializeFirebase } from "./config/firebase.js";
import authRoutes from "./routes/auth.routes.js";
import leetcodeRoutes from "./routes/leetcode.routes.js";
import codeforcesRoutes from "./routes/codeforces.routes.js";
import githubRoutes from "./routes/github.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import contestRoutes from "./routes/contest.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import codechefRoutes from "./routes/codechef.routes.js";
import gfgRoutes from "./routes/gfg.routes.js";
import problemsRoutes from "./routes/problems.routes.js";
import recommendationsRoutes from "./routes/recommendations.routes.js";
import usersRoutes from "./routes/users.routes.js";
import friendsRoutes from "./routes/friends.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import pingRoutes from "./routes/ping.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import streamRoutes from "./routes/stream.routes.js";

dotenv.config();
initializeFirebase();

const app = express();

// CORS configuration - CRITICAL: Must include PATCH method
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://codeorbit-sage.vercel.app",
    "https://codeorbit-git-main-arpit-srivastavas-projects-4aa240ca.vercel.app",
    "https://codeorbit-9eqzasyrb-arpit-srivastavas-projects-4aa240ca.vercel.app"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
};

// Apply CORS middleware FIRST - before any routes
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/codeforces", codeforcesRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/codechef", codechefRoutes);
app.use("/api/gfg", gfgRoutes);
app.use("/api/problems", problemsRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/ping", pingRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/stream", streamRoutes);

export default app;
