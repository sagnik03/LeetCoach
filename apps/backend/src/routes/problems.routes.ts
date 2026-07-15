import { Router } from 'express';
import { 
  syncProblem, 
  getRevisionQueue, 
  reviewProblem, 
  updateNotes, 
  addMistake 
} from '../controllers/problems.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Protect all routes in this router
router.use(authMiddleware as any);

router.post('/sync', syncProblem);
router.get('/queue', getRevisionQueue);
router.post('/:userProblemId/review', reviewProblem);
router.patch('/:userProblemId/notes', updateNotes);
router.post('/:userProblemId/mistakes', addMistake);

export default router;
