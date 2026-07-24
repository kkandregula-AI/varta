import { parseRSS } from '../lib/rss.js';

export default async function handler(req, res) {
  try {
    const r = await fetch('https://news.smol.ai/rss.xml', {
      headers: { 'User-Agent': 'VARTA-PWA/1.0 (+personal reader)' }
    });
    if (!r.ok) throw new Error('feed ' + r.status);
    const xml = await r.text();
    const items = parseRSS(xml, 15);
    // cache at the edge for 15 min so we don't hammer the source
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    res.status(200).json(items);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
