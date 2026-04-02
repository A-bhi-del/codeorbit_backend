# CodeOrbit Backend API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-backend-url.com/api
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. User Signup
```http
POST /auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Signup successful"
}
```

### 2. User Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

---

## 💻 Platform Connection Endpoints

### 3. Connect LeetCode
```http
POST /leetcode/connect
```

**Request Body:**
```json
{
  "username": "your_leetcode_username"
}
```

**Response:**
```json
{
  "message": "Add this code to your LeetCode README",
  "verificationCode": "CODOLIO-abc123def"
}
```

### 4. Verify LeetCode
```http
POST /leetcode/verify
```

**Request Body:** None (uses stored username)

**Response:**
```json
{
  "message": "LeetCode Verified Successfully",
  "totalSolved": 150,
  "contestRating": 1850,
  "contestsPlayed": 25,
  "totalActiveDays": 120,
  "badges": [
    {
      "name": "Annual Badge 2024",
      "icon": "badge_icon_url"
    }
  ],
  "activityDaysAdded": 45
}
```

### 5. Connect Codeforces
```http
POST /codeforces/connect
```

**Request Body:**
```json
{
  "handle": "your_codeforces_handle"
}
```

**Response:**
```json
{
  "message": "Codeforces connected successfully",
  "codeforces": {
    "handle": "your_handle",
    "rating": 1650,
    "maxRating": 1750,
    "rank": "Expert",
    "solvedProblems": 200,
    "contestsPlayed": 45
  }
}
```

### 6. Connect GitHub
```http
POST /github/connect
```

**Request Body:**
```json
{
  "username": "your_github_username"
}
```

**Response:**
```json
{
  "message": "GitHub connected successfully",
  "github": {
    "username": "your_username",
    "avatar": "avatar_url",
    "followers": 50,
    "following": 30,
    "publicRepos": 25,
    "totalStars": 100,
    "totalContributions": 1500,
    "contributionGraph": []
  }
}
```

---

## 📊 Problems & Questions Endpoints

### 7. Get All Problems (All Platforms)
```http
GET /problems/all
```

**Request Body:** None

**Response:**
```json
{
  "problems": [
    {
      "id": "1-A",
      "title": "Two Sum",
      "titleSlug": "two-sum",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "status": "Accepted",
      "language": "python3",
      "runtime": "45ms",
      "memory": "14.2MB",
      "link": "https://leetcode.com/problems/two-sum/",
      "platform": "LeetCode"
    },
    {
      "id": "1234-A",
      "title": "Watermelon",
      "contestId": 1234,
      "index": "A",
      "rating": 800,
      "tags": ["math", "implementation"],
      "timestamp": "2024-01-14T15:20:00.000Z",
      "language": "GNU C++17",
      "link": "https://codeforces.com/problemset/problem/1234/A",
      "platform": "Codeforces"
    }
  ],
  "totalProblems": 250,
  "platformStats": {
    "leetcode": {
      "total": 150,
      "connected": true
    },
    "codeforces": {
      "total": 100,
      "connected": true
    }
  },
  "message": "Problems fetched successfully"
}
```

### 8. Get LeetCode Problems Only
```http
GET /leetcode/problems
```
**OR**
```http
GET /problems/leetcode
```

**Request Body:** None

**Response:**
```json
{
  "problems": [
    {
      "id": "submission_id",
      "title": "Two Sum",
      "titleSlug": "two-sum",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "status": "Accepted",
      "language": "python3",
      "runtime": "45ms",
      "memory": "14.2MB",
      "link": "https://leetcode.com/problems/two-sum/",
      "platform": "LeetCode"
    }
  ],
  "total": 150,
  "platform": "LeetCode"
}
```

### 9. Get Codeforces Problems Only
```http
GET /codeforces/problems
```
**OR**
```http
GET /problems/codeforces
```

**Request Body:** None

**Response:**
```json
{
  "problems": [
    {
      "id": "1234-A",
      "title": "Watermelon",
      "contestId": 1234,
      "index": "A",
      "rating": 800,
      "tags": ["math", "implementation"],
      "timestamp": "2024-01-14T15:20:00.000Z",
      "language": "GNU C++17",
      "link": "https://codeforces.com/problemset/problem/1234/A",
      "platform": "Codeforces"
    }
  ],
  "total": 100,
  "platform": "Codeforces"
}
```

---

## 🏆 Contest Endpoints

### 10. Get Upcoming Contests
```http
GET /contests
```

**Request Body:** None

**Response:**
```json
{
  "contests": [
    {
      "platform": "Codeforces",
      "name": "Codeforces Round #912 (Div. 2)",
      "startTime": "2024-01-20T14:35:00.000Z",
      "duration": 2,
      "link": "https://codeforces.com/contest/1234"
    },
    {
      "platform": "LeetCode",
      "name": "Weekly Contest 380",
      "startTime": "2024-01-21T02:30:00.000Z",
      "duration": 1.5,
      "link": "https://leetcode.com/contest/weekly-contest-380"
    }
  ]
}
```

---

## 📈 Analytics Endpoints

### 11. Get Consistency Score
```http
GET /analytics/consistency
```

**Request Body:** None

**Response:**
```json
{
  "consistencyScore": 85
}
```

### 12. Get Weekly Activity Trend
```http
GET /analytics/weekly
```

**Request Body:** None

**Response:**
```json
{
  "weeklyTrend": [
    { "day": "Mon", "count": 5 },
    { "day": "Tue", "count": 3 },
    { "day": "Wed", "count": 7 },
    { "day": "Thu", "count": 2 },
    { "day": "Fri", "count": 4 },
    { "day": "Sat", "count": 6 },
    { "day": "Sun", "count": 1 }
  ]
}
```

### 13. Get Activity Heatmap
```http
GET /analytics/heatmap
```

**Request Body:** None

**Response:**
```json
{
  "heatmapData": [
    {
      "date": "2024-01-01",
      "count": 5,
      "level": 2
    },
    {
      "date": "2024-01-02", 
      "count": 0,
      "level": 0
    }
  ]
}
```

---

## 🏅 Leaderboard Endpoints

### 14. Get Global Leaderboard
```http
GET /leaderboard?page=1
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)

**Request Body:** None

**Response:**
```json
{
  "page": 1,
  "users": [
    {
      "email": "user1@example.com",
      "displayName": "John Doe",
      "photoURL": "avatar_url",
      "avatar": "avatar_url",
      "leetcodeSolved": 500,
      "cfRating": 1800,
      "githubStars": 150,
      "score": 890
    }
  ]
}
```

---

## 👤 Profile Endpoints

### 15. Get User Profile
```http
GET /profile
```

**Request Body:** None

**Response:**
```json
{
  "user": {
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": "avatar_url",
    "leetcode": {
      "username": "john_leetcode",
      "verified": true,
      "totalSolved": 150,
      "contestRating": 1850,
      "contestsPlayed": 25,
      "difficultyBreakdown": [
        { "name": "Easy", "value": 80, "color": "oklch(0.7 0.18 165)" },
        { "name": "Medium", "value": 60, "color": "oklch(0.75 0.15 80)" },
        { "name": "Hard", "value": 10, "color": "oklch(0.6 0.22 330)" }
      ],
      "badges": []
    },
    "codeforces": {
      "handle": "john_cf",
      "rating": 1650,
      "maxRating": 1750,
      "rank": "Expert",
      "solvedProblems": 200,
      "contestsPlayed": 45
    },
    "github": {
      "username": "john_github",
      "avatar": "avatar_url",
      "followers": 50,
      "publicRepos": 25,
      "totalStars": 100,
      "totalContributions": 1500
    },
    "activity": [
      {
        "date": "2024-01-15",
        "count": 5
      }
    ],
    "lastSyncedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🔄 Sync Endpoints

### 16. Manual Sync All Platforms
```http
POST /sync/all
```

**Request Body:** None

**Response:**
```json
{
  "message": "Sync completed successfully",
  "synced": {
    "leetcode": true,
    "codeforces": true,
    "github": true
  },
  "lastSyncedAt": "2024-01-15T10:30:00.000Z"
}
```

---

---

## 🤖 AI Recommendation Endpoints

### 17. Get AI-Powered Problem Recommendations
```http
GET /recommendations/ai
```

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "analysis": {
    "dominantTopics": ["graph", "array", "dynamic_programming"],
    "currentDifficultyLevel": "easy-medium",
    "solvingPattern": "consistent graph problems, needs difficulty progression",
    "identifiedGaps": ["advanced graph algorithms", "tree traversal"]
  },
  "recommendations": [
    {
      "title": "Binary Tree Level Order Traversal",
      "platform": "LeetCode",
      "difficulty": "Medium",
      "topics": ["tree", "bfs", "queue"],
      "reasoning": "Next step in graph/tree learning path after mastering basic traversal",
      "priority": "high",
      "estimatedTime": "30-45 minutes",
      "learningObjective": "Master BFS traversal in trees"
    },
    {
      "title": "Number of Islands",
      "platform": "LeetCode", 
      "difficulty": "Medium",
      "topics": ["graph", "dfs", "bfs"],
      "reasoning": "Apply graph concepts to 2D grid problems",
      "priority": "high",
      "estimatedTime": "25-40 minutes",
      "learningObjective": "Grid-based graph problems"
    }
  ],
  "learningPath": {
    "currentFocus": "Graph Algorithms",
    "nextMilestone": "Medium Graph Problems",
    "suggestedStudyOrder": ["BFS/DFS", "Shortest Path", "MST", "Topological Sort"]
  },
  "basedOnProblems": 18,
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "message": "AI recommendations generated successfully"
}
```

### 18. Get Topic-Specific Recommendations
```http
GET /recommendations/topic?topic=graph&difficulty=medium&platform=leetcode
```

**Query Parameters:**
- `topic` (required): Topic name (e.g., "graph", "dp", "array")
- `difficulty` (required): Difficulty level ("easy", "medium", "hard")
- `platform` (required): Platform name ("leetcode", "codeforces")

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "topic": "graph",
  "difficulty": "medium",
  "platform": "leetcode",
  "problems": [
    {
      "title": "Course Schedule",
      "description": "Detect cycle in directed graph using topological sorting",
      "keyConcepts": ["topological_sort", "cycle_detection", "dfs"],
      "difficulty": "medium",
      "estimatedTime": "35-50 minutes",
      "prerequisites": ["basic graph traversal", "dfs understanding"]
    },
    {
      "title": "Clone Graph",
      "description": "Deep copy of undirected graph using DFS/BFS",
      "keyConcepts": ["graph_cloning", "dfs", "hashmap"],
      "difficulty": "medium", 
      "estimatedTime": "25-40 minutes",
      "prerequisites": ["graph representation", "dfs/bfs"]
    }
  ],
  "message": "Specific medium graph problems for leetcode"
}
```

### 19. Get Learning Path Suggestions
```http
GET /recommendations/learning-path
```

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "learningPath": {
    "currentFocus": "Graph Algorithms",
    "nextMilestone": "Advanced Graph Algorithms",
    "suggestedStudyOrder": [
      "Basic Graph Traversal (DFS/BFS)",
      "Shortest Path Algorithms",
      "Minimum Spanning Tree",
      "Topological Sorting",
      "Advanced Graph Problems"
    ]
  },
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "message": "Learning path from recent analysis"
}
```

### 20. Get Difficulty Progression Analysis
```http
GET /recommendations/difficulty-progression?platform=leetcode
```

**Query Parameters:**
- `platform` (optional): Platform to analyze ("leetcode", "codeforces")

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "platform": "leetcode",
  "currentLevel": "Easy",
  "nextLevel": "Medium",
  "suggestions": [
    "Continue practicing Easy problems to build confidence",
    "Gradually attempt Medium problems (1-2 per week)",
    "Focus on understanding solutions rather than just solving",
    "Review and optimize your previous solutions"
  ],
  "message": "Difficulty progression analysis"
}
```

## ❌ Error Responses

All endpoints may return these error responses:

### 401 Unauthorized
```json
{
  "message": "Not authorized"
}
```

### 404 Not Found
```json
{
  "message": "User not found"
}
```

### 400 Bad Request
```json
{
  "message": "Invalid credentials"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## 📝 Usage Notes

1. **Authentication**: All endpoints except `/auth/signup` and `/auth/login` require JWT token
2. **Rate Limiting**: Be mindful of external API rate limits (LeetCode, Codeforces, GitHub)
3. **Data Freshness**: Use `/sync/all` endpoint to refresh data from external platforms
4. **Pagination**: Leaderboard supports pagination with `page` query parameter
5. **Platform Status**: Check `platformStats` in responses to see which platforms are connected
6. **Error Handling**: Always handle error responses appropriately in your frontend
7. **Links**: All problem objects include direct `link` field for navigation to original problem

## 🔗 Frontend Integration Example

```javascript
// Example: Fetch all problems
const fetchAllProblems = async () => {
  try {
    const response = await fetch('/api/problems/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log(data.problems); // Array of problems with links
  } catch (error) {
    console.error('Error:', error);
  }
};
```