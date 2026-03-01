import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.get('/positions', async (_req, res, next) => {
  try {
    const positions = await rpc('listdigidollarpositions');
    res.json({ positions: positions || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
