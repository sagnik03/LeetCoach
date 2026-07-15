import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

// API sub-routers
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

export default router;
