import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.get('/status', async (_req, res, next) => {
  try {
    const [oracle, info, stats, balance] = await Promise.all([
      rpc('getoracleprice'),
      rpc('getblockchaininfo'),
      rpc('getdigidollarstats'),
      rpc('getdigidollarbalance'),
    ]);
    res.json({ oracle, height: info.blocks, stats, balance });
  } catch (err) {
    next(err);
  }
});

export default router;
