import { Router } from 'express';
import { dd } from '../sdk.js';

const router = Router();

router.get('/address', async (_req, res, next) => {
  try {
    const address = await dd.getReceiveAddress();
    res.json({ address });
  } catch (err) {
    next(err);
  }
});

export default router;
