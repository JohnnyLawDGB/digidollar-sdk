import { Router } from 'express';
import { dd, withWriteLock } from '../sdk.js';
import { sendJson } from '../middleware/bigint-serializer.js';

const router = Router();

router.post('/redeem', async (req, res, next) => {
  try {
    const { positionId } = req.body as { positionId?: string };
    if (!positionId) {
      res.status(400).json({ error: 'Missing positionId', code: 'BAD_REQUEST' });
      return;
    }
    const result = await withWriteLock(() =>
      dd.redeem({ positionId })
    );
    sendJson(res, result, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
