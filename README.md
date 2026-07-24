# VĀRTA — AI Twitter, pushed to your phone

A PWA that sends **one push notification** whenever a new **AINews** recap (the daily AI-Twitter/Reddit/Discord roundup by Smol AI / swyx) publishes. It never touches the X API — it watches the publisher's public RSS feed and links back.

- **Source:** `https://news.smol.ai/rss.xml` — public RSS, free, no key.
- **Push:** real Web Push via a service worker + a Vercel Cron job.
- **Cost:** $0 on Vercel Hobby + Upstash free tier.

---

## What each piece does
| File | Role |
|---|---|
| `index.html` | The app: enable-push button, browse recent recaps, topic filter, source credit |
| `sw.js` | Service worker — receives the push, shows the notification, opens the source on tap |
| `api/feed.js` | Server-side proxy that parses the RSS to JSON (avoids browser CORS) |
| `api/subscribe.js` | Stores a device's push subscription |
| `api/cron.js` | Runs hourly: if the newest recap changed, pushes to every subscriber |
| `api/vapid.js` | Hands the public VAPID key to the browser |
| `lib/rss.js`, `lib/redis.js` | Shared RSS parser + Upstash helper |

---

## Setup (about 10 minutes)

### 1. Storage — Upstash Redis (free)
Create a database at [upstash.com](https://upstash.com) → copy the **REST URL** and **REST TOKEN**. It only stores your push subscriptions and the last-seen recap ID.

### 2. VAPID keys (push identity)
Generate once:
```bash
npx web-push generate-vapid-keys
```
A ready-to-use pair is already generated for you below — or make your own:
```
VAPID_PUBLIC_KEY=BPAdGgFtbCCPwUmvWXEfVNpcuiKm_glPcc6zVTfRezDj9fNEUv35om7rvWjsWjUcos3CDRdARTVKXGIwJsUOql4
VAPID_PRIVATE_KEY=ZWqfxe6zG0u-0f6ZIj_l68K9pchQOLpvDTq9RKaRNoE
```
> Treat the private key like a password — don't commit it. Rotate it if it ever leaks.

### 3. Deploy
```bash
vercel        # from this folder
```
Then in **Project → Settings → Environment Variables**, add everything from `.env.example`:
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET` (any long random string). Redeploy.

### 4. Install on your iPhone ⚠️ required for push
iOS only allows Web Push from an **installed** app:
1. Open your Vercel URL in **Safari**.
2. **Share → Add to Home Screen.**
3. Open VĀRTA **from the home screen** (not the tab).
4. Tap **Enable push** → allow.

On Android/desktop Chrome you can enable push straight from the tab.

---

## Cron frequency note
`vercel.json` schedules `/api/cron` hourly (`0 * * * *`). **Vercel Hobby runs cron at most once/day.** For true hourly checks either:
- upgrade to Pro, **or**
- delete the `crons` block and point a free external cron ([cron-job.org](https://cron-job.org)) at
  `https://YOUR-APP.vercel.app/api/cron?key=YOUR_CRON_SECRET` every hour.

The first cron run only **seeds** the latest ID (no notification) so you don't get pinged for an old issue. You'll be notified from the next new recap onward.

## Test it end-to-end
After enabling push on your phone, force a send by clearing the stored ID: delete the `varta:lastguid` key in Upstash, then hit `…/api/cron?key=YOUR_CRON_SECRET` twice (first call seeds, second pushes).

---

## Extending (your usual moves)
- **BYOK topic summary:** add `api/summarize.js` that takes the recap text + a user-supplied Anthropic key and returns a 3-bullet digest filtered to your topics (agents, open weights, India/policy). Keeps the free/deterministic vs. BYOK-AI split.
- **Multiple feeds:** the parser is source-agnostic — add TechCrunch/Latent Space feeds and tag notifications by source.

---

Recaps, wording, and all credit belong to **AINews / Smol AI** (news.smol.ai). VĀRTA is a personal reader/notifier.

*Designed & Architected by Krishnamurthy Kandregula · Made by Claude.*
"# varta" 
