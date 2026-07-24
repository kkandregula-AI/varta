// Upstash Redis over REST — works from any serverless function, free tier is plenty.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your env.
const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redis(...cmd) {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error('redis ' + r.status + ' ' + (await r.text()));
  return (await r.json()).result;
}

export const SUBS_KEY = 'varta:subs';
export const GUID_KEY = 'varta:lastguid';
