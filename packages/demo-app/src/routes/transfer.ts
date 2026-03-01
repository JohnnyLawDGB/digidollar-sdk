import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.post('/transfer', async (req, res, next) => {
  try {
    const { toAddress, amount } = req.body as { toAddress?: string; amount?: number };
    if (!toAddress || amount == null) {
      res.status(400).json({ error: 'Missing toAddress or amount', code: 'BAD_REQUEST' });
      return;
    }
    const result = await rpc('senddigidollar', [toAddress, amount]);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
