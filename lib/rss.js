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
function clean(s = '') {
  return decode(s)
    .replace(/<[^>]+>/g, ' ')                        // html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')           // md images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // md links -> label
    .replace(/(\*\*|__)(.*?)\1/g, '$2')              // bold
    .replace(/`+/g, '')                              // code ticks
    .replace(/^#{1,6}\s*/gm, '')                     // headings
    .replace(/\*\*|__/g, '')                         // any unpaired markers
    .replace(/\s+/g, ' ').trim();
}

// AINews uses a stock title on slow days; it's not a useful headline.
const GENERIC_TITLE = /^(not much happened today|quiet day|nothing much happened)/i;

function firstSentence(s = '', max = 120) {
  const m = s.match(/^(.{25,}?[.!?])(?:\s|$)/);
  let out = m ? m[1] : s;
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out;
}
function shortDate(s = '') { const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

// Returns [{ title, link, guid, date, snippet }]
export function parseRSS(xml, limit = 15) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, limit).map(block => {
    const title = tag(block, 'title').replace(/^\[AINews\]\s*/i, '');
    const link = tag(block, 'link');
    const guid = tag(block, 'guid') || link || title;
    const raw = tag(block, 'pubDate');
    const date = shortDate(raw);
    const dt = new Date(raw);
    const iso = isNaN(dt) ? '' : dt.toISOString();
    const full = clean(tag(block, 'description'));
    const quiet = GENERIC_TITLE.test(title);
    // On stock-title days, lead with the actual top story instead.
    const headline = quiet && full ? firstSentence(full) : title;
    // Don't repeat the lead sentence in the snippet when it became the headline.
    let body = full;
    if (quiet) {
      const lead = full.match(/^(.{25,}?[.!?])(?:\s|$)/);
      if (lead && full.length > lead[1].length + 40) body = full.slice(lead[1].length).trim();
    }
    let snippet = body;
    if (snippet.length > 200) snippet = snippet.slice(0, 200).replace(/\s+\S*$/, '') + '…';
    return { title, headline, quiet, link, guid, date, iso, snippet };
  });
}
