# CodeOrbit Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB
- Firebase Admin SDK credentials
- GitHub Personal Access Token

## Environment Setup

1. Create `.env` file in the root directory:

```env
# MongoDB Connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret (Use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server Port
PORT=5000

# GitHub Token (For fetching contribution data)
GITHUB_TOKEN=your_github_personal_access_token

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. For production:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
```
POST /api/auth/signup          - Create new account
POST /api/auth/login           - Login with email/password
POST /api/auth/google          - Google OAuth login
GET  /api/auth/profile         - Get user profile (Protected)
```

### Platform Connections
```
POST /api/leetcode/connect     - Connect LeetCode account
POST /api/leetcode/verify      - Verify LeetCode connection
POST /api/codeforces/connect   - Connect Codeforces account
POST /api/github/connect       - Connect GitHub account
```

### Analytics
```
GET /api/analytics/consistency        - Get consistency score
GET /api/analytics/weekly-activity    - Get weekly activity trend
GET /api/analytics/heatmap            - Get activity heatmap data
GET /api/analytics/platform-comparison - Compare platform stats
```

### Leaderboard
```
GET /api/leaderboard?page=1    - Get global leaderboard (paginated)
```

### Contests
```
GET /api/contests              - Get upcoming contests
```

### Resources
```
GET /api/resources             - Get learning resources
```

### Profile
```
GET /api/profile/:email        - Get public profile by email
```

## Database Schema

### User Model
```javascript
{
  email: String (required, unique),
  password: String (required for local auth),
  firebaseUid: String (for Google auth),
  displayName: String,
  photoURL: String,
  provider: 'local' | 'google',
  
  // Platform data
  leetcode: {
    username: String,
    verified: Boolean,
    verificationCode: String,
    codeExpiry: Date,
    totalSolved: Number,
    contestRating: Number,
    contestsPlayed: Number,
    totalActiveDays: Number,
    badges: [{ name: String, icon: String }]
  },
  
  codeforces: {
    handle: String,
    rating: Number,
    maxRating: Number,
    rank: String,
    solvedProblems: Number,
    contestsPlayed: Number
  },
  
  github: {
    username: String,
    avatar: String,
    followers: Number,
    following: Number,
    publicRepos: Number,
    totalStars: Number,
    totalContributions: Number,
    contributionGraph: Array
  },
  
  activity: [{ date: String, count: Number }],
  lastSyncedAt: Date
}
```

## Automated Jobs

### Stats Update Cron Job
Runs daily at 2:00 AM to sync all user data:
- Updates Codeforces stats
- Updates GitHub stats
- Updates activity tracking
- Updates last synced timestamp

Located in: `jobs/updateStats.job.js`

## Security Considerations

### CRITICAL - Before Deployment

1. **Change JWT Secret**: Generate a strong random string
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Rotate MongoDB Credentials**: Change database password

3. **Regenerate GitHub Token**: Create new personal access token

4. **Secure Firebase Keys**: Never commit service account JSON

5. **Update CORS Origins**: Add your production domain to `app.js`

### Current CORS Configuration
```javascript
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://codeorbit-sage.vercel.app",
    // Add your production domains
  ],
  credentials: true
}
```

## External API Integrations

### LeetCode
- GraphQL API: `https://leetcode.com/graphql`
- No authentication required
- Rate limits apply

### Codeforces
- REST API: `https://codeforces.com/api/`
- No authentication required
- Rate limit: 1 request per 2 seconds

### GitHub
- GraphQL API: `https://api.github.com/graphql`
- Requires Personal Access Token
- Rate limit: 5000 requests/hour

## Project Structure

```
Codolio_backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── firebase.js        # Firebase Admin SDK
├── controllers/
│   ├── auth.controller.js
│   ├── leetcode.controller.js
│   ├── codeforces.controller.js
│   ├── github.controller.js
│   ├── analytics.controller.js
│   ├── leaderboard.controller.js
│   ├── contest.controller.js
│   ├── resource.controller.js
│   └── profile.controller.js
├── middleware/
│   └── auth.middleware.js  # JWT & Firebase token verification
├── models/
│   └── User.js            # User schema
├── routes/
│   └── *.routes.js        # Route definitions
├── services/
│   ├── leetcode.service.js
│   ├── codeforces.service.js
│   ├── github.service.js
│   ├── contest.service.js
│   └── resource.service.js
├── utils/
│   ├── activity.util.js
│   ├── consistency.util.js
│   ├── heatmap.util.js
│   └── weeklyTrend.util.js
├── jobs/
│   └── updateStats.job.js  # Cron jobs
├── app.js                  # Express app setup
└── server.js              # Server entry point
```

## Testing

### Test Authentication
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Platform Connection
```bash
# Connect Codeforces (requires auth token)
curl -X POST http://localhost:5000/api/codeforces/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"handle":"tourist"}'
```

## Deployment

### Environment Variables
Ensure all environment variables are set in your hosting platform:
- MongoDB URI
- JWT Secret
- GitHub Token
- Firebase credentials
- PORT (if required)

### Recommended Platforms
- Railway
- Render
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

### Health Check Endpoint
Consider adding:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})
```

## Monitoring & Logging

### Add Logging
Install Winston or Pino:
```bash
npm install winston
```

### Add Error Tracking
Consider Sentry:
```bash
npm install @sentry/node
```

## Performance Optimization

1. **Add Redis Caching**: Cache frequently accessed data
2. **Database Indexing**: Add indexes to User model
3. **Rate Limiting**: Implement rate limiting middleware
4. **Request Validation**: Add input validation with Joi/Zod

## Next Steps

1. Add input validation middleware
2. Implement rate limiting
3. Add comprehensive error logging
4. Create API documentation (Swagger)
5. Add unit and integration tests
6. Set up CI/CD pipeline
7. Implement Redis caching
8. Add database indexes
9. Set up monitoring and alerts
10. Create backup strategy for MongoDB

## Troubleshooting

### MongoDB Connection Issues
- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Ensure network access is configured

### Firebase Authentication Errors
- Verify service account credentials
- Check private key format (must include \n)
- Ensure Firebase project is active

### External API Failures
- Check rate limits
- Verify API tokens are valid
- Handle network timeouts gracefully

## Support

For issues or questions, check:
- MongoDB Atlas documentation
- Firebase Admin SDK docs
- Express.js documentation
- Platform API documentation (LeetCode, Codeforces, GitHub)
