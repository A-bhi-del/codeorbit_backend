# 🐛 GitHub OAuth - Frontend Debugging Guide

## ❌ Current Problem

```
✅ User authorizes on GitHub
✅ User added in GitHub OAuth Apps
❌ Data not showing on website
❌ No way to know if connection succeeded
```

## 🔍 Root Cause

**Frontend is not calling the backend API** after receiving the OAuth code from GitHub.

---

## ✅ Backend Changes (Already Done)

### New Endpoint Added:

```http
GET /api/github/status
Headers: { "Authorization": "Bearer <token>" }

Response:
{
  "connected": true,
  "github": {
    "username": "johndoe",
    "avatar": "https://...",
    "followers": 100,
    "publicRepos": 25,
    "totalStars": 150,
    "totalContributions": 500,
    "connectedAt": "2026-06-14T10:30:00.000Z"
  }
}
```

---

## 🎯 Frontend Fix - Step by Step

### Step 1: Check Current Frontend Code

Do you have these files?
- [ ] `ConnectGithub.jsx` or similar
- [ ] `GithubCallback.jsx` or similar
- [ ] Route for `/auth/github/callback`

### Step 2: Complete Frontend Implementation

#### File 1: `src/config/github.js`

```javascript
export const GITHUB_CONFIG = {
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || 'YOUR_CLIENT_ID',
  redirectUri: `${window.location.origin}/auth/github/callback`,
  scope: 'read:user,repo',
  authorizeUrl: 'https://github.com/login/oauth/authorize'
};
```

#### File 2: `src/pages/ConnectGithub.jsx`

```javascript
import { useState } from 'react';
import { GITHUB_CONFIG } from '../config/github';

function ConnectGithub() {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    
    // Build GitHub OAuth URL
    const params = new URLSearchParams({
      client_id: GITHUB_CONFIG.clientId,
      redirect_uri: GITHUB_CONFIG.redirectUri,
      scope: GITHUB_CONFIG.scope
    });

    const githubAuthUrl = `${GITHUB_CONFIG.authorizeUrl}?${params.toString()}`;
    
    console.log('🔗 Redirecting to:', githubAuthUrl);
    
    // Redirect to GitHub
    window.location.href = githubAuthUrl;
  };

  return (
    <div className="connect-github-page">
      <div className="connect-card">
        <h2>Connect Your GitHub</h2>
        <p>Track your contributions and repositories</p>
        
        <button 
          onClick={handleConnect}
          disabled={loading}
          className="github-connect-btn"
        >
          {loading ? 'Redirecting...' : 'Connect GitHub Account'}
        </button>
      </div>
    </div>
  );
}

export default ConnectGithub;
```

#### File 3: `src/pages/GithubCallback.jsx` (CRITICAL - This is missing!)

```javascript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function GithubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing GitHub authorization...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Step 1: Get OAuth code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        console.log('🔍 Callback params:', { code: code?.substring(0, 10) + '...', error });

        if (error) {
          console.error('❌ GitHub OAuth error:', error);
          setStatus('Authorization failed. Redirecting...');
          setTimeout(() => navigate('/profile'), 2000);
          return;
        }

        if (!code) {
          console.error('❌ No authorization code received');
          setStatus('No authorization code received. Redirecting...');
          setTimeout(() => navigate('/profile'), 2000);
          return;
        }

        setStatus('Connecting your GitHub account...');
        console.log('📡 Sending code to backend...');

        // Step 2: Get user's JWT token
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('❌ No authentication token found');
          setStatus('Please login first');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Step 3: Send code to backend
        const response = await axios.post(
          `${BACKEND_URL}/api/github/oauth/callback`,
          { code },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ GitHub connected:', response.data);
        setStatus('GitHub connected successfully! Redirecting...');
        setIsLoading(false);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);

      } catch (error) {
        console.error('❌ GitHub connection failed:', error);
        console.error('Error response:', error.response?.data);
        
        setStatus(
          error.response?.data?.message || 
          'Failed to connect GitHub. Please try again.'
        );
        setIsLoading(false);

        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="github-callback-page">
      <div className="callback-card">
        <h2>GitHub Connection</h2>
        <div className="status-container">
          {isLoading && <div className="spinner"></div>}
          <p className={isLoading ? 'status-loading' : 'status-complete'}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GithubCallback;
```

#### File 4: `src/components/GithubStatus.jsx`

```javascript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function GithubStatus() {
  const navigate = useNavigate();
  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch GitHub status on component mount
  useEffect(() => {
    fetchGithubStatus();
  }, []);

  const fetchGithubStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('📡 Fetching GitHub status...');
      
      const response = await axios.get(
        `${BACKEND_URL}/api/github/status`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log('✅ GitHub status:', response.data);
      
      if (response.data.connected) {
        setGithubData(response.data.github);
      }
    } catch (error) {
      console.error('❌ Failed to fetch GitHub status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');

      await axios.post(
        `${BACKEND_URL}/api/github/refresh`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Refresh status
      await fetchGithubStatus();
      alert('GitHub data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
      alert('Failed to refresh GitHub data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub?')) return;

    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');

      await axios.post(
        `${BACKEND_URL}/api/github/disconnect`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setGithubData(null);
      alert('GitHub disconnected successfully');
    } catch (error) {
      console.error('Disconnect failed:', error);
      alert('Failed to disconnect GitHub');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div>Loading GitHub status...</div>;
  }

  if (!githubData) {
    return (
      <div className="github-not-connected">
        <h3>GitHub Not Connected</h3>
        <p>Connect your GitHub to track contributions</p>
        <button 
          onClick={() => navigate('/connect-github')}
          className="connect-btn"
        >
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="github-connected">
      <h3>GitHub Connected ✅</h3>
      
      <div className="github-profile">
        <img src={githubData.avatar} alt="GitHub avatar" />
        <div className="github-info">
          <h4>@{githubData.username}</h4>
          <p>👥 {githubData.followers} followers</p>
          <p>📦 {githubData.publicRepos} repositories</p>
          <p>⭐ {githubData.totalStars} stars</p>
          <p>📊 {githubData.totalContributions} contributions</p>
        </div>
      </div>

      <div className="github-actions">
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="refresh-btn"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button 
          onClick={handleDisconnect} 
          disabled={refreshing}
          className="disconnect-btn"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default GithubStatus;
```

### Step 3: Add Routes

```javascript
// In your App.jsx or router file
import ConnectGithub from './pages/ConnectGithub';
import GithubCallback from './pages/GithubCallback';

<Routes>
  {/* ... other routes ... */}
  
  <Route path="/connect-github" element={<ConnectGithub />} />
  <Route path="/auth/github/callback" element={<GithubCallback />} />
  
  {/* Profile page should show GithubStatus component */}
  <Route path="/profile" element={<Profile />} />
</Routes>
```

### Step 4: Add to Profile Page

```javascript
// In your Profile.jsx
import GithubStatus from '../components/GithubStatus';

function Profile() {
  return (
    <div className="profile">
      {/* ... other profile content ... */}
      
      <div className="platforms-section">
        <h2>Connected Platforms</h2>
        
        {/* GitHub Status */}
        <GithubStatus />
        
        {/* Other platforms... */}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Flow

### Test 1: Check Status Endpoint

```bash
# Check if GitHub is connected
curl -X GET http://localhost:5000/api/github/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response (not connected):
{
  "connected": false,
  "github": null
}

# Expected Response (connected):
{
  "connected": true,
  "github": {
    "username": "johndoe",
    "avatar": "https://...",
    ...
  }
}
```

### Test 2: Complete OAuth Flow

1. **Click "Connect GitHub"**
   - Console: `🔗 Redirecting to: https://github.com/login/oauth/authorize?...`
   - Browser: Redirects to GitHub

2. **Authorize on GitHub**
   - Browser: GitHub shows authorization page
   - Click "Authorize"

3. **Redirect to Callback**
   - Browser: `your-site.com/auth/github/callback?code=ABC123`
   - Console: `🔍 Callback params: { code: "ABC123..." }`
   - Console: `📡 Sending code to backend...`

4. **Backend Processing**
   - Console: `✅ GitHub connected: { ... }`
   - Status: "GitHub connected successfully!"

5. **Redirect to Profile**
   - Browser: Navigates to `/profile`
   - Shows GitHub data ✅

---

## 🐛 Debug Checklist

If data not showing:

### Check 1: GitHub OAuth App Settings
- [ ] Callback URL matches: `https://your-site.com/auth/github/callback`
- [ ] Client ID correct in frontend `.env`
- [ ] Client Secret correct in backend `.env`

### Check 2: Frontend Routes
- [ ] Route `/auth/github/callback` exists
- [ ] `GithubCallback.jsx` component exists
- [ ] Component is properly mounted

### Check 3: Backend API
- [ ] Backend running and accessible
- [ ] Route `/api/github/oauth/callback` exists
- [ ] Route `/api/github/status` exists

### Check 4: Browser Console
```javascript
// After authorization, check console
// Should see:
🔍 Callback params: { code: "...", error: null }
📡 Sending code to backend...
✅ GitHub connected: { github: {...} }

// If you see errors, share them for debugging
```

### Check 5: Network Tab
```
POST /api/github/oauth/callback
Status: 200 OK ✅
Response: { message: "GitHub connected successfully via OAuth", ... }

Status: 500 ❌
Response: { error: "..." } → Share this error
```

---

## 📋 Quick Debug Commands

```javascript
// In browser console after callback
console.log('Current URL:', window.location.href);
console.log('Search params:', new URLSearchParams(window.location.search).get('code'));
console.log('Token exists:', !!localStorage.getItem('token'));

// Test status endpoint
fetch('http://localhost:5000/api/github/status', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('GitHub status:', d));
```

---

## ✅ Summary

**Problem**: Frontend not calling backend after OAuth authorization

**Solution**: 
1. ✅ Backend has `/api/github/status` endpoint
2. 🔴 Frontend needs `GithubCallback.jsx` to handle redirect
3. 🔴 Frontend needs to call `/api/github/oauth/callback`
4. 🔴 Frontend needs to show GitHub status in profile

**Next Steps**:
1. Create missing `GithubCallback.jsx` component
2. Add callback route to router
3. Test complete flow
4. Check GitHub data appears in profile

**Agar abhi bhi issue hai, toh console logs share karo!** 🐛
