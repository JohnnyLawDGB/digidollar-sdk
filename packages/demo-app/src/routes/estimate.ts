import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.get('/estimate-collateral', async (req, res, next) => {
  try {
    const amount = req.query['amount'];
    const tier = req.query['tier'];
    if (!amount || !tier) {
      res.status(400).json({ error: 'Missing amount or tier', code: 'BAD_REQUEST' });
      return;
    }
    const cents = parseInt(String(amount), 10);
    const lockTier = parseInt(String(tier), 10);
    if (isNaN(cents) || cents <= 0) {
      res.status(400).json({ error: 'Invalid amount', code: 'BAD_REQUEST' });
      return;
    }
    if (lockTier < 0 || lockTier > 9) {
      res.status(400).json({ error: 'Tier must be 0-9', code: 'BAD_REQUEST' });
      return;
    }
    const estimate = await rpc('estimatecollateral', [cents, lockTier]);
    res.json(estimate);
  } catch (err) {
    next(err);
  }
});

export default router;
