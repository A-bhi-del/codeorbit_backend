import axios from 'axios';
import User from "../models/User.js";
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Start AI Interview
 */
export const startInterview = async (req, res) => {
  try {
    const { interview_type, difficulty, resume_path } = req.body;
    
    // Validate difficulty level (AI service accepts: beginner, intermediate, advanced)
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    const normalizedDifficulty = difficulty?.toLowerCase();
    
    if (!normalizedDifficulty || !validDifficulties.includes(normalizedDifficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level',
        message: 'Difficulty must be one of: beginner, intermediate, advanced'
      });
    }
    
    // Build coding profile from user's CodeOrbit data
    // (req.user is just the user's id, so load the document)
    const me = await User.findById(req.user).select('leetcode codeforces codechef gfg lastRecommendations');
    const analysis = me?.lastRecommendations?.recommendations?.analysis;
    // The AI service wants whole numbers and plain strings, so coerce (ratings are often decimals).
    const int = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : null);
    const topics = (list) =>
      (Array.isArray(list) ? list : [])
        .map((t) => (typeof t === 'string' ? t : t?.topic || t?.name || t?.tag || ''))
        .filter(Boolean);
    const codingProfile = {
      leetcode_rating: int(me?.leetcode?.contestRating),
      codeforces_rating: int(me?.codeforces?.rating),
      codechef_rating: int(me?.codechef?.rating),
      strong_topics: topics(analysis?.dominantTopics),
      weak_topics: topics(analysis?.identifiedGaps),
      total_problems_solved:
        (int(me?.leetcode?.totalSolved) || 0) + (int(me?.codeforces?.solvedProblems) || 0) +
        (int(me?.codechef?.problemsSolved) || 0) + (int(me?.gfg?.problemsSolved) || 0),
      contest_participation: (int(me?.leetcode?.contestsPlayed) || 0) + (int(me?.codeforces?.contestsPlayed) || 0)
    };
    
    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/interview/start`, {
      user_id: String(req.user),
      interview_type: interview_type || 'technical',
      difficulty: normalizedDifficulty,
      coding_profile: codingProfile
    }, {
      params: { resume_path }
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('AI Service Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start interview',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Upload Resume
 */
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);
    
    const response = await axios.post(
      `${AI_SERVICE_URL}/interview/upload-resume`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Resume Upload Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload resume',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Submit Answer
 */
export const submitAnswer = async (req, res) => {
  try {
    const { session_id, answer } = req.body;
    
    if (!session_id || !answer) {
      return res.status(400).json({
        success: false,
        error: 'session_id and answer are required'
      });
    }
    
    const response = await axios.post(`${AI_SERVICE_URL}/interview/answer`, {
      session_id,
      answer
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Submit Answer Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit answer',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Get Follow-up Question
 */
export const getFollowup = async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'session_id is required'
      });
    }
    
    const response = await axios.post(`${AI_SERVICE_URL}/interview/followup`, {
      session_id,
      should_followup: true
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Followup Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get follow-up question',
      details: error.response?.data || error.message
    });
  }
};

/**
 * End Interview
 */
export const endInterview = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const response = await axios.post(`${AI_SERVICE_URL}/interview/end/${session_id}`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('End Interview Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to end interview',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Get Session Status
 */
export const getSessionStatus = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const response = await axios.get(`${AI_SERVICE_URL}/interview/session/${session_id}`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Session Status Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get session status',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Advance Stage
 */
export const advanceStage = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const response = await axios.post(`${AI_SERVICE_URL}/interview/advance-stage/${session_id}`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Advance Stage Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to advance stage',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Submit Voice Answer
 */
export const submitVoiceAnswer = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No audio file uploaded' 
      });
    }
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(req.file.path), req.file.originalname);
    
    const response = await axios.post(
      `${AI_SERVICE_URL}/voice/voice-answer/${session_id}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Voice Answer Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit voice answer',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Stop AI Speech
 */
export const stopSpeech = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const response = await axios.post(`${AI_SERVICE_URL}/voice/stop-speech/${session_id}`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Stop Speech Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to stop speech',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Convert Text to Speech
 */
export const textToSpeech = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text is required'
      });
    }
    
    const response = await axios.post(`${AI_SERVICE_URL}/voice/text-to-speech`, {
      text
    }, {
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('Text to Speech Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to convert text to speech',
      details: error.response?.data || error.message
    });
  }
};
