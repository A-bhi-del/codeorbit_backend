import User from "../models/User.js";

export const getLeaderboard = async (req, res) => {

  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    const users = await User.aggregate([

      {
        $addFields: {

          leetcodeSolved: {
            $ifNull: ["$leetcode.totalSolved", 0]
          },

          cfRating: {
            $ifNull: ["$codeforces.rating", 0]
          },

          githubStars: {
            $ifNull: ["$github.totalStars", 0]
          }

        }
      },

      {
        $addFields: {

          score: {
            $add: [
              "$leetcodeSolved",
              { $divide: ["$cfRating", 10] },
              { $multiply: ["$githubStars", 2] }
            ]
          }

        }
      },

      {
        $sort: { score: -1 }
      },

      {
        $skip: (page - 1) * limit
      },

      {
        $limit: limit
      },

      {
        $project: {

          email: 1,
          displayName: 1,
          photoURL: 1,

          avatar: {
            $ifNull: ["$photoURL", "$github.avatar"]
          },

          leetcodeSolved: 1,
          cfRating: 1,
          githubStars: 1,

          score: 1

        }
      }

    ]);

    res.json({
      page,
      users
    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching leaderboard"
    });

  }

};