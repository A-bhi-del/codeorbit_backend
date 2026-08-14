# CodeOrbit Authentication API Documentation

Base URL: `http://localhost:5000` (or your deployed URL)

## Authentication Endpoints

### 1. User Signup (Local)

**Endpoint:** `POST /api/auth/signup`

**Description:** Create a new user account with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "message": "Signup successful"
}
```

**Error Responses:**
```json
// User already exists (400)
{
  "message": "User already exists"
}

// Server error (500)
{
  "message": "Error message"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

### 2. User Login (Local)

**Endpoint:** `POST /api/auth/login`

**Description:** Login with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "displayName": null,
    "photoURL": null,
    "provider": "local"
  }
}
```

**Error Responses:**
```json
// Invalid credentials (400)
{
  "message": "Invalid credentials"
}

// Server error (500)
{
  "message": "Error message"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

### 3. Google Authentication (Firebase)

**Endpoint:** `POST /api/auth/google`

**Description:** Authenticate user with Google via Firebase ID token

**Request Body:**
```json
{
  "idToken": "firebase_id_token_from_frontend"
}
```

**Success Response (200):**
```json
{
  "message": "Google authentication successful",
  "token": "firebase_id_token_here",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@gmail.com",
    "displayName": "John Doe",
    "photoURL": "https://lh3.googleusercontent.com/a/...",
    "provider": "google"
  }
}
```

**Error Responses:**
```json
// Missing ID token (400)
{
  "message": "ID token is required"
}

// Invalid token (401)
{
  "message": "Invalid Google token"
}

// Server error (500)
{
  "message": "Error message"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "your_firebase_id_token_here"
  }'
```

---

### 4. Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Get current authenticated user's profile

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": "https://lh3.googleusercontent.com/a/...",
    "provider": "google",
    "platforms": {
      "leetcode": {
        "username": "johndoe",
        "verified": true,
        "totalSolved": 150,
        "contestRating": 1800,
        "contestsPlayed": 25,
        "totalActiveDays": 120,
        "badges": [
          {
            "name": "Annual Badge 2023",
            "icon": "https://..."
          }
        ]
      },
      "codeforces": {
        "handle": "johndoe",
        "rating": 1650,
        "maxRating": 1750,
        "rank": "expert",
        "solvedProblems": 200,
        "contestsPlayed": 30
      },
      "github": {
        "username": "johndoe",
        "avatar": "https://avatars.githubusercontent.com/u/...",
        "followers": 50,
        "following": 30,
        "publicRepos": 25,
        "totalStars": 100,
        "totalContributions": 500,
        "contributionGraph": [...]
      }
    }
  }
}
```

**Error Responses:**
```json
// Not authorized (401)
{
  "message": "Not authorized"
}

// Invalid token (401)
{
  "message": "Invalid token"
}

// User not found (404)
{
  "message": "User not found"
}

// Server error (500)
{
  "message": "Error message"
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer your_token_here"
```

---

## Frontend Integration Examples

### React with Firebase

```javascript
// Firebase setup
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google Sign-In
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store token
      localStorage.setItem('token', data.token);
      console.log('User:', data.user);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Local Login
const loginWithEmail = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Local Signup
const signupWithEmail = async (email, password) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Get User Profile
const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
};

// Logout
const logout = () => {
  localStorage.removeItem('token');
  // Redirect to login page
};
```

### Axios Setup (Optional)

```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Token Usage

### For JWT Tokens (Local Auth)
- Store the token from login response
- Include in Authorization header: `Bearer <jwt_token>`
- Token expires in 7 days

### For Firebase Tokens (Google Auth)
- Use the Firebase ID token directly
- Include in Authorization header: `Bearer <firebase_id_token>`
- Token expires in 1 hour (Firebase handles refresh automatically)

---

## Error Handling

All endpoints return consistent error format:
```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error