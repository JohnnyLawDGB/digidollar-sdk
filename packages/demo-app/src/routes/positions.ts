import { Router } from 'express';
import { dd } from '../sdk.js';
import { sendJson } from '../middleware/bigint-serializer.js';

const router = Router();

router.get('/positions', async (_req, res, next) => {
  try {
    const positions = await dd.getPositions(true);
    sendJson(res, { positions });
  } catch (err) {
    next(err);
  }
});

export default router;
