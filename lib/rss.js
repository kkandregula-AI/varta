// Feed parser for VĀRTA. Handles both RSS 2.0 (<item>) and Atom (<entry>),
// so lab blogs (OpenAI, DeepMind, Hugging Face) and press feeds all work.
// No external deps.

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

// RSS uses <link>text</link>; Atom uses <link href="..."/>. Prefer alternate.
function linkOf(block) {
  const rss = tag(block, 'link');
  if (rss) return rss;
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map(m => m[1]);
  const pick = links.find(a => /rel=["']alternate["']/i.test(a)) || links.find(a => !/rel=["']self["']/i.test(a)) || links[0] || '';
  const href = pick.match(/href=["']([^"']+)["']/i);
  return href ? decode(href[1]) : '';
}

function clean(s = '') {
  return decode(s)
    .replace(/<[^>]+>/g, ' ')                        // html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')           // md images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // md links -> label
    .replace(/(\*\*|__)(.*?)\1/g, '$2')              // bold
    .replace(/`+/g, '')                              // code ticks
    .replace(/^#{1,6}\s*/gm, '')                     // headings
    .replace(/\*\*|__/g, '')                         // stray markers
    .replace(/\s+/g, ' ').trim();
}

function shortDate(s = '') {
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// AINews uses a stock title on slow days; not a useful headline.
const GENERIC_TITLE = /^(not much happened today|quiet day|nothing much happened)/i;

function firstSentence(s = '', max = 120) {
  const m = s.match(/^(.{25,}?[.!?])(?:\s|$)/);
  let out = m ? m[1] : s;
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out;
}

// Returns [{ source, title, headline, quiet, link, guid, date, iso, snippet }]
export function parseRSS(xml, limit = 10, source = '') {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  return blocks.slice(0, limit).map(block => {
    const title = tag(block, 'title').replace(/^\[AINews\]\s*/i, '');
    const link = linkOf(block);
    const guid = tag(block, 'guid') || tag(block, 'id') || link || title;
    const raw = tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || tag(block, 'dc:date');
    const date = shortDate(raw);
    const dt = new Date(raw);
    const iso = isNaN(dt) ? '' : dt.toISOString();

    const full = clean(tag(block, 'description') || tag(block, 'content:encoded') || tag(block, 'content') || tag(block, 'summary'));
    const quiet = GENERIC_TITLE.test(title);
    const headline = quiet && full ? firstSentence(full) : title;

    // Don't repeat the lead sentence in the snippet when it became the headline.
    let body = full;
    if (quiet) {
      const lead = full.match(/^(.{25,}?[.!?])(?:\s|$)/);
      if (lead && full.length > lead[1].length + 40) body = full.slice(lead[1].length).trim();
    }
    let snippet = body;
    if (snippet.length > 200) snippet = snippet.slice(0, 200).replace(/\s+\S*$/, '') + '…';

    return { source, title, headline, quiet, link, guid, date, iso, snippet };
  });
}
