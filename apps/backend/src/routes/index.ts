import { Router } from 'express';
import authRoutes from './auth.routes.js';
import problemsRoutes from './problems.routes.js';

const router = Router();

// API sub-routers
router.use('/auth', authRoutes);
router.use('/problems', problemsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

export default router;
