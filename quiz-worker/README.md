# Three Cities quiz and visit counts server

A tiny Cloudflare Worker with a D1 database. It keeps two kinds of anonymous counts:
- The quiz: two counts per question and city (how often the city was offered, how often it was picked).
- Visits: one counter per day, kind and value (visits, country, source, device, how long visits last, cities, sounds, kits, shares and so on), shown on /admin under Visitors.

Nothing else: no IPs, no ids, no cookies, no times per event.

## Set it up in the Cloudflare dashboard (about 10 minutes)

1. **Make the database.** Storage & Databases → D1 → Create. Name it `three-cities-quiz`.
2. **Make the tables.** Open the database → Console. Paste the lines in `schema.sql` and run them.
   (`tally`: one row per question and city. `events`: one row per day, kind and value. No people, no times, no addresses.)
3. **Make the Worker.** Compute (Workers) → Create → Start with Hello World. Name it `three-cities-quiz` and deploy.
4. **Paste the code.** Edit code → replace everything with `worker.js` → Deploy.
5. **Connect the database.** The Worker → Settings → Bindings → Add → D1 database.
   Variable name `DB`, database `three-cities-quiz`. Save, and deploy again if it asks.
6. **Check it.** Open the Worker's address, like `https://three-cities-quiz.<your-name>.workers.dev/`.
   You should see `{"ok":true,"service":"three-cities-quiz","questions":20}`.
7. Send that address to Claude, and it goes into `QUIZ_LIVE` in index.html. Until then the quiz runs
   without results and collects nothing.

## Or with the command line

    npm i -g wrangler && wrangler login
    wrangler d1 create three-cities-quiz        # copy the database_id into wrangler.toml
    wrangler d1 execute three-cities-quiz --remote --file schema.sql
    wrangler deploy

## Adding the visit counts to a Worker you already set up

1. Database → Console: run the `CREATE TABLE IF NOT EXISTS events …` line from `schema.sql`.
2. The Worker → Edit code → replace everything with the new `worker.js` → Deploy.
3. Open /admin. The Visitors section fills in as people visit. Your own visits: press "Don't count my own visits on this device" on /admin.

## Leaving out your own visits
- Per device: open the site once with `?notrack=1` on the end (or use the button on /admin). `?notrack=0` turns counting back on.
- Per network: on /admin press Show my address, then add it to a Worker variable called `OWNER_IPS` (comma separated for several). The address is only compared, never stored.

## Endpoints

- `POST /answer` `{ "q": "food", "c": ["lisbon|portugal", "osaka|japan", "quito|ecuador"], "p": 0 }`
- `GET /results?q=food&c=lisbon|portugal~osaka|japan~quito|ecuador`
- `GET /top?q=food&min=20` the leaderboard for a question, handy for posts
- `POST /e` a batch of anonymous visit events from the app, `{ "e": [["visit", "reddit.com"], ["city", "london"], ["stay", "30s"]] }`. Bots and other sites are ignored, and free text kinds are capped per day.
- `GET /analytics?key=…&days=120` the daily counters, for /admin. Locked by the same key as /stats.
- `GET /myip` shows the caller's own address (for filling in `OWNER_IPS`).
- `GET /stats?key=…` everything, for /admin. Set a secret called `ADMIN_KEY` (Worker → Settings → Variables and Secrets → Add, type Secret) to lock it.

The question ids live in both `worker.js` and `index.html` (QUIZ). Add new ones to both.
Optional: a Cloudflare rate limiting rule on `/answer` (for example 30 requests a minute per visitor) keeps spam down.
