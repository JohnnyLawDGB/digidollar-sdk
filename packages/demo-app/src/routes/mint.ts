import { Router } from 'express';
import { dd, withWriteLock } from '../sdk.js';
import { sendJson } from '../middleware/bigint-serializer.js';

const router = Router();

router.post('/mint', async (req, res, next) => {
  try {
    const { amount, tier } = req.body as { amount?: number; tier?: number };
    if (amount == null || tier == null) {
      res.status(400).json({ error: 'Missing amount or tier', code: 'BAD_REQUEST' });
      return;
    }
    const result = await withWriteLock(() =>
      dd.mint({ ddAmountCents: BigInt(amount), lockTier: tier })
    );
    sendJson(res, result, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
