import crypto from "crypto";
import User from "../models/User.js";
import { fetchLeetCodeFullProfile } from "../services/leetcode.service.js";

// 🔹 STEP 1 — Connect LeetCode
export const connectLeetCode = async (req, res) => {
  try {
    const userId = req.user;
    const { username } = req.body;

    if (!userId)
      return res.status(401).json({ message: "User not authorized" });

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const code = "CODOLIO-" + crypto.randomBytes(4).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    user.leetcode = {
      username,
      verified: false,
      verificationCode: code,
      codeExpiry: expiry
    };

    await user.save();

    res.json({
      message: "Add this code to your LeetCode README",
      verificationCode: code
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 STEP 2 — Verify + Fetch Full Stats
export const verifyLeetCode = async (req, res) => {
  try {
    const userId = req.user;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.leetcode?.verificationCode)
      return res.status(400).json({ message: "No verification pending" });

    if (new Date() > user.leetcode.codeExpiry)
      return res.status(400).json({ message: "Verification expired" });

    const profileData = await fetchLeetCodeFullProfile(
      user.leetcode.username
    );

    if (!profileData || !profileData.matchedUser)
      return res.status(400).json({
        message: "Profile not accessible or private"
      });

    // 🔹 Bio verification
    const bio =
      profileData.matchedUser.profile?.aboutMe || "";

    if (!bio.includes(user.leetcode.verificationCode))
      return res.status(400).json({
        message: "Code not found in README"
      });

    // 🔹 Total solved
    const stats =
      profileData.matchedUser.submitStats.acSubmissionNum;

    const totalSolved = stats.find(
      (item) => item.difficulty === "All"
    )?.count || 0;

    // 🔹 Contest rating
    const rating =
      profileData.userContestRanking?.rating || 0;

    const contestsPlayed =
      profileData.userContestRanking?.attendedContestsCount || 0;

    // 🔹 Active days
    const calendarRaw =
      profileData.matchedUser.userCalendar?.submissionCalendar || "{}";

    const calendar = JSON.parse(calendarRaw);
    const totalActiveDays = Object.keys(calendar).length;

    // 🔹 Badges
    const badges =
      profileData.matchedUser.badges?.map((b) => ({
        name: b.displayName,
        icon: b.icon
      })) || [];

    // 🔹 Save in DB
    user.leetcode.verified = true;
    user.leetcode.verificationCode = null;
    user.leetcode.codeExpiry = null;
    user.leetcode.totalSolved = totalSolved;
    user.leetcode.contestRating = rating;
    user.leetcode.contestsPlayed = contestsPlayed;
    user.leetcode.totalActiveDays = totalActiveDays;
    user.leetcode.badges = badges;

    await user.save();

    res.json({
      message: "LeetCode Verified Successfully",
      totalSolved,
      contestRating: rating,
      contestsPlayed,
      totalActiveDays,
      badges
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};