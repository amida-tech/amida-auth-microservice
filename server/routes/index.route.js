import express from 'express';
import authRoutes from './auth.route';
import userRoutes from './user.route';
import p from '../../package';

const router = express.Router(); // eslint-disable-line new-cap
const version = p.version.split('.').shift();
const baseURL = (version > 0 ? `/v${version}` : '');

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount routes
router.use(`${baseURL}/auth`, authRoutes);
router.use(`${baseURL}/user`, userRoutes);

export default router;
