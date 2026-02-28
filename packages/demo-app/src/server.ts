import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import api from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', true);
app.use(express.json());

// API routes
app.use('/api', api);

// Static files (production)
const clientDir = path.resolve(__dirname, '../client');
app.use(express.static(clientDir));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Error handler
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`DigiDollar demo server listening on port ${env.port}`);
});
