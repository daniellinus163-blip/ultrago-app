import dotenv from 'dotenv';
import express from 'express';

import paymentRouter from './payment.mjs';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use('/api', paymentRouter);

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Appride Paystack API', health: '/api/health' });
});

if (!process.env.PAYSTACK_SECRET_KEY?.trim()) {
  console.warn('Warning: PAYSTACK_SECRET_KEY is missing — Paystack routes will fail.');
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Paystack server listening on http://0.0.0.0:${port}`);
  console.log(`Verify endpoint: http://<your-lan-ip>:${port}/api/verify-charge`);
});
