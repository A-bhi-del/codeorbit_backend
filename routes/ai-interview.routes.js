import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import * as aiInterviewController from '../controllers/ai-interview.controller.js';

const router = express.Router();

// Configure multer for resume uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/ai-interview/start
 * @desc    Start a new AI interview session
 * @access  Private
 */
router.post('/start', aiInterviewController.startInterview);

/**
 * @route   POST /api/ai-interview/upload-resume
 * @desc    Upload resume for interview
 * @access  Private
 */
router.post('/upload-resume', upload.single('resume'), aiInterviewController.uploadResume);

/**
 * @route   POST /api/ai-interview/answer
 * @desc    Submit answer to interview question
 * @access  Private
 */
router.post('/answer', aiInterviewController.submitAnswer);

/**
 * @route   POST /api/ai-interview/followup
 * @desc    Get follow-up question
 * @access  Private
 */
router.post('/followup', aiInterviewController.getFollowup);

/**
 * @route   POST /api/ai-interview/end/:session_id
 * @desc    End interview and get report
 * @access  Private
 */
router.post('/end/:session_id', aiInterviewController.endInterview);

/**
 * @route   GET /api/ai-interview/session/:session_id
 * @desc    Get interview session status
 * @access  Private
 */
router.get('/session/:session_id', aiInterviewController.getSessionStatus);

/**
 * @route   POST /api/ai-interview/advance/:session_id
 * @desc    Advance to next interview stage
 * @access  Private
 */
router.post('/advance-stage/:session_id', aiInterviewController.advanceStage);

export default router;
