import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// Standard middleware
app.use(cors({
  origin: '*', // For extension development. Can restrict to chrome-extension://<id> later
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Main API Router
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`[LeetCoach Backend] Server running on http://localhost:${config.port} in ${config.nodeEnv} mode`);
});
