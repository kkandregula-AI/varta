import { redis, SUBS_KEY } from '../lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !body.endpoint) return res.status(400).json({ error: 'not a subscription' });
    // Store as a set member so duplicates from the same device collapse.
    await redis('SADD', SUBS_KEY, JSON.stringify(body));
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
