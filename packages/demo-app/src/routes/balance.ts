import { Router } from 'express';
import { dd } from '../sdk.js';
import { sendJson } from '../middleware/bigint-serializer.js';

const router = Router();

router.get('/balance', async (_req, res, next) => {
  try {
    const [balance, utxos] = await Promise.all([
      dd.getBalance(),
      dd.getUTXOs(),
    ]);
    sendJson(res, {
      dd: balance,
      dgbBalance: utxos.standardBalance,
      ddBalance: utxos.ddBalance,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
