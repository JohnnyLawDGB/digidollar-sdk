import { Router } from 'express';
import { dd, withWriteLock } from '../sdk.js';
import { sendJson } from '../middleware/bigint-serializer.js';

const router = Router();

router.post('/transfer', async (req, res, next) => {
  try {
    const { toAddress, amount } = req.body as { toAddress?: string; amount?: number };
    if (!toAddress || amount == null) {
      res.status(400).json({ error: 'Missing toAddress or amount', code: 'BAD_REQUEST' });
      return;
    }
    const result = await withWriteLock(() =>
      dd.transfer({
        recipients: [{ toAddress, ddAmountCents: BigInt(amount) }],
      })
    );
    sendJson(res, result, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
