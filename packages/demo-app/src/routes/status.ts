import { Router } from 'express';
import { dd } from '../sdk.js';
import { sendJson } from '../middleware/bigint-serializer.js';

const router = Router();

router.get('/status', async (_req, res, next) => {
  try {
    const [oracle, height, stats, balance] = await Promise.all([
      dd.getOraclePrice(),
      dd.getBlockHeight(),
      dd.getStats(),
      dd.getBalance(),
    ]);
    sendJson(res, { oracle, height, stats, balance });
  } catch (err) {
    next(err);
  }
});

export default router;
