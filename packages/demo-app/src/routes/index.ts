import { Router } from 'express';
import { readLimiter, writeLimiter } from '../middleware/rate-limiter.js';
import status from './status.js';
import balance from './balance.js';
import positions from './positions.js';
import address from './address.js';
import estimate from './estimate.js';
import mint from './mint.js';
import transfer from './transfer.js';
import redeem from './redeem.js';

const api = Router();

// Read endpoints
api.use(readLimiter, status);
api.use(readLimiter, balance);
api.use(readLimiter, positions);
api.use(readLimiter, address);
api.use(readLimiter, estimate);

// Write endpoints
api.use(writeLimiter, mint);
api.use(writeLimiter, transfer);
api.use(writeLimiter, redeem);

export default api;
