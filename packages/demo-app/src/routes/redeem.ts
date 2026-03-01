import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.post('/redeem', async (req, res, next) => {
  try {
    const { positionId, amount } = req.body as { positionId?: string; amount?: number };
    if (!positionId) {
      res.status(400).json({ error: 'Missing positionId', code: 'BAD_REQUEST' });
      return;
    }
    // If amount not specified, the RPC redeems the full position
    const params = amount != null ? [positionId, amount] : [positionId];
    const result = await rpc('redeemdigidollar', params);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
