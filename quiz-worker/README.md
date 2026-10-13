# Three Cities quiz server

A tiny Cloudflare Worker with a D1 database. It keeps two counts per question and city
(how often the city was offered, how often it was picked). Nothing else: no IPs, no ids, no times.

## Set it up in the Cloudflare dashboard (about 10 minutes)

1. **Make the database.** Storage & Databases → D1 → Create. Name it `three-cities-quiz`.
2. **Make the table.** Open the database → Console. Paste everything in `schema.sql` and run it.
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

## Endpoints

- `POST /answer` `{ "q": "food", "c": ["lisbon|portugal", "osaka|japan", "quito|ecuador"], "p": 0 }`
- `GET /results?q=food&c=lisbon|portugal~osaka|japan~quito|ecuador`
- `GET /top?q=food&min=20` the leaderboard for a question, handy for posts

The question ids live in both `worker.js` and `index.html` (QUIZ). Add new ones to both.
Optional: a Cloudflare rate limiting rule on `/answer` (for example 30 requests a minute per visitor) keeps spam down.
