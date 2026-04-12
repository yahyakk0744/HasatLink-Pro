import { Router } from 'express';
import auth from '../middleware/auth';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  upvoteQuestion,
  deleteQuestion,
  createAnswer,
  upvoteAnswer,
  markBestAnswer,
  deleteAnswer,
} from '../controllers/forumController';

const router = Router();

// Questions
router.get('/forum/questions', getQuestions);
router.get('/forum/questions/:id', getQuestion);
router.post('/forum/questions', auth, createQuestion);
router.post('/forum/questions/:id/upvote', auth, upvoteQuestion);
router.delete('/forum/questions/:id', auth, deleteQuestion);

// Answers
router.post('/forum/questions/:id/answers', auth, createAnswer);
router.post('/forum/answers/:id/upvote', auth, upvoteAnswer);
router.post('/forum/questions/:questionId/best-answer/:answerId', auth, markBestAnswer);
router.delete('/forum/answers/:id', auth, deleteAnswer);

export default router;
