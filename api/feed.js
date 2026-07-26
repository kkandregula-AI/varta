import { parseRSS } from '../lib/rss.js';
import { FEEDS } from '../lib/feeds.js';

async function fetchOne(f) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6500);   // don't let one slow feed stall the response
  try {
    const r = await fetch(f.url, {
      headers: { 'User-Agent': 'VARTA-PWA/1.0 (+personal reader)', 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
      signal: ctrl.signal
    });
    if (!r.ok) return [];
    return parseRSS(await r.text(), 8, f.source);
  } catch (_) {
    return [];        // a dead/blocked feed just contributes nothing
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req, res) {
  try {
    const lists = await Promise.all(FEEDS.map(fetchOne));
    let items = lists.flat().filter(i => i.title && i.link);
    // newest first; ISO strings sort chronologically, undated items sink
    items.sort((a, b) => (b.iso || '').localeCompare(a.iso || ''));
    items = items.slice(0, 40);
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    res.status(200).json(items);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
