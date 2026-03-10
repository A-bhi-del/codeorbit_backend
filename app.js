import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
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

dotenv.config();
connectDB();
initializeFirebase();

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/codeforces", codeforcesRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/profile", profileRoutes);

export default app;