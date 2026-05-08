// Validation utilities for social features

export const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 30) {
    return { valid: false, message: "Username must be 3-30 characters" };
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, and underscores" };
  }

  return { valid: true };
};

export const validateBio = (bio) => {
  if (bio && bio.length > 500) {
    return { valid: false, message: "Bio must be less than 500 characters" };
  }

  return { valid: true };
};

export const validateUrl = (url) => {
  if (!url) return { valid: true };

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, message: "Invalid URL format" };
  }
};

export const sanitizeSearchQuery = (query) => {
  if (!query) return "";
  
  // Remove special regex characters
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
};
