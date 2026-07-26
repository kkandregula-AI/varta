// Sources VĀRTA merges into the browse list. Each item is tagged with `source`
// and links back to the original, so every entry is properly credited.
// Keep this list tight — more feeds = more noise. Uncomment extras as needed.
//
// The push notification stays tied to AINews only (see api/cron.js); these
// additional sources enrich the in-app feed, they don't fire notifications.

export const FEEDS = [
  { source: 'AINews',       url: 'https://news.smol.ai/rss.xml' },              // the AI-Twitter recap (anchor)
  { source: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },      // open models & releases
  { source: 'OpenAI',       url: 'https://openai.com/news/rss.xml' },           // lab-direct
  { source: 'DeepMind',     url: 'https://deepmind.google/blog/feed/basic/' },  // lab-direct
  { source: 'The Verge',    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' }, // mainstream / policy
  { source: 'TechCrunch',   url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },     // funding & products

  // --- extras: uncomment to include ---
  // { source: 'Ars Technica',    url: 'https://arstechnica.com/ai/feed/' },
  // { source: 'MIT Tech Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed' },
  // { source: 'The Decoder',     url: 'https://the-decoder.com/feed/' },
  // { source: 'MarkTechPost',    url: 'https://www.marktechpost.com/feed/' },
];
