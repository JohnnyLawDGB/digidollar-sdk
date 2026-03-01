import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.get('/balance', async (_req, res, next) => {
  try {
    const [dd, dgb] = await Promise.all([
      rpc('getdigidollarbalance'),
      rpc('getbalance'),
    ]);
    res.json({ dd, dgb });
  } catch (err) {
    next(err);
  }
});

export default router;
