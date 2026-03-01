import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.post('/mint', async (req, res, next) => {
  try {
    const { amount, tier } = req.body as { amount?: number; tier?: number };
    if (amount == null || tier == null) {
      res.status(400).json({ error: 'Missing amount or tier', code: 'BAD_REQUEST' });
      return;
    }
    const result = await rpc('mintdigidollar', [amount, tier]);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
