import { Router } from 'express';
import { dd } from '../sdk.js';
import { sendJson } from '../middleware/bigint-serializer.js';

const router = Router();

router.get('/estimate-collateral', async (req, res, next) => {
  try {
    const amount = req.query['amount'];
    const tier = req.query['tier'];
    if (!amount || !tier) {
      res.status(400).json({ error: 'Missing amount or tier', code: 'BAD_REQUEST' });
      return;
    }
    const ddAmountCents = BigInt(String(amount));
    const lockTier = parseInt(String(tier), 10);
    if (lockTier < 0 || lockTier > 9) {
      res.status(400).json({ error: 'Tier must be 0-9', code: 'BAD_REQUEST' });
      return;
    }
    const estimate = await dd.estimateCollateral(ddAmountCents, lockTier);
    sendJson(res, estimate);
  } catch (err) {
    next(err);
  }
});

export default router;
