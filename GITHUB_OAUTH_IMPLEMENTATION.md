# 🔐 GitHub OAuth Integration - Complete Guide

## 📋 Overview

**Old Method** ❌: Fixed server token in `.env` - all users shared same token
**New Method** ✅: Each user connects their own GitHub account via OAuth

---

## 🔧 Backend Changes (Already Done)

### Files Modified:

1. ✅ `services/github.service.js` - Added OAuth functions
2. ✅ `controllers/github.controller.js` - Removed manual method, added OAuth
3. ✅ `routes/github.routes.js` - Updated routes
4. ✅ `models/User.js` - Added `accessToken` and `connectedAt` fields

---

## 🌐 Backend API Routes

### Old Routes ❌ (REMOVED):
```
POST /api/github/connect
Body: { "username": "github-username" }
```

### New Routes ✅ (ACTIVE):

#### 1. Connect GitHub (OAuth)
```http
POST /api/github/oauth/callback
Headers: {
  "Authorization": "Bearer <user-jwt-token>",
  "Content-Type": "application/json"
}
Body: {
  "code": "github-oauth-code-from-redirect"
}

Response (200 OK):
{
  "message": "GitHub connected successfully via OAuth",
  "github": {
    "username": "user123",
    "avatar": "https://...",
    "followers": 100,
    "following": 50,
    "publicRepos": 25,
    "totalStars": 150,
    "totalContributions": 500,
    "contributionGraph": [...]
  },
  "activityDaysAdded": 365
}
```

#### 2. Disconnect GitHub
```http
POST /api/github/disconnect
Headers: {
  "Authorization": "Bearer <user-jwt-token>"
}

Response (200 OK):
{
  "message": "GitHub disconnected successfully"
}
```

#### 3. Refresh GitHub Data
```http
POST /api/github/refresh
Headers: {
  "Authorization": "Bearer <user-jwt-token>"
}

Response (200 OK):
{
  "message": "GitHub data refreshed successfully",
  "github": { ... }
}
```

---

## 🎯 Frontend Implementation Required

### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill details:
   - **Application name**: CodeOrbit
   - **Homepage URL**: `https://your-frontend-url.com`
   - **Authorization callback URL**: `https://your-frontend-url.com/auth/github/callback`
4. Click "Register application"
5. Copy:
   - **Client ID**: `Ov23li...`
   - **Client Secret**: Generate and copy

### Step 2: Add to Backend `.env`

```env
# GitHub OAuth (ADD THESE)
GITHUB_CLIENT_ID=Ov23liXXXXXXXXXX
GITHUB_CLIENT_SECRET=your_client_secret_here

# Old token (CAN REMOVE - NOT NEEDED ANYMORE)
# GITHUB_TOKEN=ghp_xxxxx
```

### Step 3: Frontend OAuth Flow

#### File: `src/pages/ConnectGithub.jsx` or similar

```javascript
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; // From Step 1
const REDIRECT_URI = 'https://your-frontend-url.com/auth/github/callback';

function ConnectGithub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Redirect user to GitHub OAuth
  const initiateGithubOAuth = () => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read:user,repo`;
    window.location.href = githubAuthUrl;
  };

  return (
    <div className="connect-github">
      <h2>Connect Your GitHub Account</h2>
      <p>Connect your GitHub to track contributions and repositories</p>
      
      <button 
        onClick={initiateGithubOAuth}
        disabled={loading}
        className="connect-btn"
      >
        {loading ? 'Connecting...' : 'Connect GitHub'}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ConnectGithub;
```

#### File: `src/pages/GithubCallback.jsx`

```javascript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function GithubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      // Step 2: Get OAuth code from URL
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('Authorization failed');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      if (!code) {
        setStatus('No authorization code received');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      try {
        setStatus('Connecting GitHub...');

        // Step 3: Send code to backend
        const token = localStorage.getItem('token'); // Your JWT token
        
        const response = await axios.post(
          'https://your-backend-url.com/api/github/oauth/callback',
          { code },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ GitHub connected:', response.data);
        setStatus('GitHub connected successfully!');
        
        // Redirect to profile after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);

      } catch (error) {
        console.error('❌ GitHub connection failed:', error);
        setStatus(error.response?.data?.message || 'Failed to connect GitHub');
        setTimeout(() => navigate('/profile'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="github-callback">
      <h2>{status}</h2>
      <p>Please wait...</p>
    </div>
  );
}

export default GithubCallback;
```

#### File: `src/components/GithubStatus.jsx`

```javascript
import { useState } from 'react';
import axios from 'axios';

function GithubStatus({ user, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        'https://your-backend-url.com/api/github/disconnect',
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      alert('GitHub disconnected successfully');
      onUpdate(); // Refresh user data
    } catch (error) {
      console.error('Disconnect failed:', error);
      alert('Failed to disconnect GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'https://your-backend-url.com/api/github/refresh',
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      alert('GitHub data refreshed!');
      onUpdate(); // Refresh user data
    } catch (error) {
      console.error('Refresh failed:', error);
      alert('Failed to refresh GitHub data');
    } finally {
      setLoading(false);
    }
  };

  if (!user.github?.username) {
    return (
      <div className="github-not-connected">
        <p>GitHub not connected</p>
        <button onClick={() => window.location.href = '/connect-github'}>
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="github-connected">
      <h3>GitHub Connected</h3>
      <div className="github-info">
        <img src={user.github.avatar} alt="GitHub avatar" />
        <p>@{user.github.username}</p>
        <p>{user.github.followers} followers</p>
        <p>{user.github.publicRepos} repos</p>
        <p>{user.github.totalStars} ⭐ stars</p>
        <p>{user.github.totalContributions} contributions</p>
      </div>
      
      <div className="github-actions">
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button onClick={handleDisconnect} disabled={loading}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default GithubStatus;
```

### Step 4: Add Routes to React Router

```javascript
// In your App.jsx or Routes.jsx
import ConnectGithub from './pages/ConnectGithub';
import GithubCallback from './pages/GithubCallback';

<Routes>
  {/* ... other routes ... */}
  
  {/* GitHub OAuth routes */}
  <Route path="/connect-github" element={<ConnectGithub />} />
  <Route path="/auth/github/callback" element={<GithubCallback />} />
</Routes>
```

---

## 🔄 Complete OAuth Flow

### Visual Flow:

```
1. User clicks "Connect GitHub"
   ↓
2. Redirect to GitHub OAuth page
   https://github.com/login/oauth/authorize?client_id=...
   ↓
3. User authorizes on GitHub
   ↓
4. GitHub redirects back to your app
   https://your-app.com/auth/github/callback?code=ABC123
   ↓
5. Frontend extracts code from URL
   ↓
6. Frontend sends code to backend
   POST /api/github/oauth/callback { code: "ABC123" }
   ↓
7. Backend exchanges code for access token
   POST https://github.com/login/oauth/access_token
   ↓
8. Backend fetches user's GitHub data using their token
   ↓
9. Backend stores data + token in user's document
   ↓
10. User is connected! ✅
```

---

## 📝 Frontend Configuration Checklist

### 1. Environment Variables

Create `.env` file in frontend:

```env
VITE_GITHUB_CLIENT_ID=Ov23liXXXXXXXXXX
VITE_BACKEND_URL=https://your-backend-url.com
VITE_FRONTEND_URL=https://your-frontend-url.com
```

### 2. Use in Code

```javascript
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const REDIRECT_URI = `${import.meta.env.VITE_FRONTEND_URL}/auth/github/callback`;
```

---

## 🧪 Testing Checklist

### Backend Testing:

```bash
# Test OAuth callback (after getting code from GitHub)
curl -X POST http://localhost:5000/api/github/oauth/callback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"github_oauth_code_here"}'

# Test disconnect
curl -X POST http://localhost:5000/api/github/disconnect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test refresh
curl -X POST http://localhost:5000/api/github/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend Testing:

1. ✅ Click "Connect GitHub" → Redirects to GitHub
2. ✅ Authorize on GitHub → Redirects back to app
3. ✅ Callback page processes code
4. ✅ Success message shown
5. ✅ Redirect to profile
6. ✅ GitHub data displayed
7. ✅ Refresh button works
8. ✅ Disconnect button works

---

## ⚠️ Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch"

**Error**: The redirect URI in the request does not match
**Solution**: Make sure REDIRECT_URI in frontend exactly matches what you set in GitHub OAuth App settings

### Issue 2: "Bad verification code"

**Error**: The code has expired or already been used
**Solution**: OAuth codes are single-use. User needs to reconnect.

### Issue 3: CORS errors

**Solution**: Make sure backend has CORS enabled for your frontend domain

```javascript
// In backend app.js or server.js
app.use(cors({
  origin: 'https://your-frontend-url.com',
  credentials: true
}));
```

---

## 🔐 Security Notes

1. ✅ **Never expose Client Secret in frontend** - Only use in backend
2. ✅ **Store access tokens securely** - Only in backend database
3. ✅ **Don't send access tokens to frontend** - Already handled in code
4. ✅ **Use HTTPS in production** - Required for OAuth
5. ✅ **Validate JWT tokens** - Already handled by `protect` middleware

---

## 📊 What User Sees

### Before Connection:
```
[GitHub Icon] GitHub
Status: Not Connected
[Connect GitHub Button]
```

### After Connection:
```
[GitHub Icon] GitHub
Status: Connected
Username: @johndoe
Followers: 150
Repos: 25
Stars: 300
Contributions: 1,234

[Refresh Data] [Disconnect]
```

---

## 🎯 Summary

### Backend Changes ✅:
- Removed manual token method
- Added OAuth flow
- Added disconnect endpoint
- Added refresh endpoint

### Frontend Changes Required 🔴:
- Create GitHub OAuth App on GitHub
- Add Client ID to frontend `.env`
- Create `ConnectGithub.jsx` page
- Create `GithubCallback.jsx` page
- Update routes
- Update profile/settings page to show GitHub status

### Environment Variables:

**Backend** (`.env`):
```env
GITHUB_CLIENT_ID=Ov23liXXXXXX
GITHUB_CLIENT_SECRET=secret_here
```

**Frontend** (`.env`):
```env
VITE_GITHUB_CLIENT_ID=Ov23liXXXXXX
VITE_BACKEND_URL=https://backend.com
VITE_FRONTEND_URL=https://frontend.com
```

---

**Ready to implement! Follow the steps above and test thoroughly.** 🚀
