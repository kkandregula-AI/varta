// Minimal RSS 2.0 parser for the AINews feed. No external deps.

function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]).trim() : '';
}
function stripHtml(s = '') { return decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function shortDate(s = '') { const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

// Returns [{ title, link, guid, date, snippet }]
export function parseRSS(xml, limit = 15) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, limit).map(block => {
    const title = tag(block, 'title');
    const link = tag(block, 'link');
    const guid = tag(block, 'guid') || link || title;
    const raw = tag(block, 'pubDate');
    const date = shortDate(raw);
    const dt = new Date(raw);
    const iso = isNaN(dt) ? '' : dt.toISOString();
    let snippet = stripHtml(tag(block, 'description'));
    if (snippet.length > 200) snippet = snippet.slice(0, 200).replace(/\s+\S*$/, '') + '…';
    return { title, link, guid, date, iso, snippet };
  });
}
