import webpush from 'web-push';
import { parseRSS } from '../lib/rss.js';
import { redis, SUBS_KEY, GUID_KEY } from '../lib/redis.js';

export default async function handler(req, res) {
  // Guard: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  // External cron (cron-job.org) can pass the same header or ?key=.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  const key = req.query.key || '';
  if (secret && auth !== `Bearer ${secret}` && key !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const r = await fetch('https://news.smol.ai/rss.xml', {
      headers: { 'User-Agent': 'VARTA-PWA/1.0 (+personal reader)' }
    });
    if (!r.ok) throw new Error('feed ' + r.status);
    const items = parseRSS(await r.text(), 1);
    const latest = items[0];
    if (!latest) return res.status(200).json({ status: 'empty feed' });

    const lastGuid = await redis('GET', GUID_KEY);
    if (lastGuid === latest.guid) {
      return res.status(200).json({ status: 'no new recap', guid: latest.guid });
    }
    // Record first so a mid-run failure can't spam on the next tick.
    await redis('SET', GUID_KEY, latest.guid);

    // First run: don't blast a notification for a back-issue, just seed the guid.
    if (!lastGuid) return res.status(200).json({ status: 'seeded', guid: latest.guid });

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:you@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const subs = (await redis('SMEMBERS', SUBS_KEY)) || [];
    const payload = JSON.stringify({
      title: 'New AI recap',
      body: latest.title.replace(/^\[AINews\]\s*/i, ''),
      url: latest.link || 'https://news.smol.ai'
    });

    let sent = 0, pruned = 0;
    await Promise.all(subs.map(async raw => {
      try {
        await webpush.sendNotification(JSON.parse(raw), payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await redis('SREM', SUBS_KEY, raw); pruned++;   // dead endpoint
        }
      }
    }));

    res.status(200).json({ status: 'pushed', guid: latest.guid, sent, pruned });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
