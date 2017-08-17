import express from 'express';
import messageRoutes from './message.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount message routes at /message
router.use('/message', messageRoutes);

export default router;
