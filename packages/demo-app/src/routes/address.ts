import { Router } from 'express';
import { rpc } from '../rpc.js';

const router = Router();

router.get('/address', async (_req, res, next) => {
  try {
    const address = await rpc('getdigidollaraddress');
    res.json({ address });
  } catch (err) {
    next(err);
  }
});

export default router;
