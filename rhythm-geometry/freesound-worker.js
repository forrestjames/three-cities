// Freesound proxy for Rhythm Geometry (Cloudflare Worker).
// It holds the Freesound API key, so the web page never sees it.
//
// Set these in the Cloudflare dashboard (Settings > Variables and Secrets):
//   FREESOUND_KEY    (secret)  your Freesound API key
//   ALLOWED_ORIGINS  (text)    comma list, e.g. https://forrestjames.github.io,http://localhost:8080
//
// Routes:
//   GET /search?q=kick&cc0=1&page=1   search Freesound (CC0 only when cc0=1)
//   Optional: &near=51.60,-0.14&km=25  only sounds geotagged within about km of that point (km 1 to 200, default 25)
//   GET /preview?u=<preview url>      stream a Freesound preview with CORS, so the page can decode it

const FS = 'https://freesound.org/apiv2';
const FIELDS = 'id,name,username,duration,license,url,previews';

function json(obj, cors, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': cache },
  });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {};

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

    if (url.pathname === '/preview') {
      // Public preview files only: freesound.org hosts, https.
      let target;
      try { target = new URL(url.searchParams.get('u') || ''); } catch { return new Response('Bad url', { status: 400 }); }
      if (target.protocol !== 'https:' || !/(^|\.)freesound\.org$/.test(target.hostname)) {
        return new Response('Not allowed', { status: 403 });
      }
      const r = await fetch(target.toString());
      if (!r.ok) return new Response('Preview not found', { status: r.status });
      return new Response(r.body, {
        status: 200,
        headers: {
          'Content-Type': r.headers.get('Content-Type') || 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    if (url.pathname === '/search') {
      if (!cors['Access-Control-Allow-Origin']) return new Response('Origin not allowed', { status: 403 });
      const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
      if (!q) return json({ results: [], count: 0 }, cors);
      const page = Math.max(1, Math.min(20, Number(url.searchParams.get('page')) || 1));
      const cc0 = url.searchParams.get('cc0') !== '0';

      // Optional place filter: a box around lat,lon (rounded, so repeat searches share the cache)
      let near = null;
      const nearRaw = (url.searchParams.get('near') || '').split(',').map(Number);
      if (nearRaw.length === 2 && nearRaw.every(Number.isFinite) && Math.abs(nearRaw[0]) <= 90 && Math.abs(nearRaw[1]) <= 180) {
        const km = Math.max(1, Math.min(200, Number(url.searchParams.get('km')) || 25));
        const lat = Math.round(nearRaw[0] * 100) / 100;
        const lon = Math.round(nearRaw[1] * 100) / 100;
        const dLat = km / 111;
        const dLon = km / (111 * Math.max(0.1, Math.cos(lat * Math.PI / 180)));
        const clamp = (v, m) => Math.max(-m, Math.min(m, v));
        near = {
          lat, lon, km,
          box: [clamp(lon - dLon, 180), clamp(lat - dLat, 90), clamp(lon + dLon, 180), clamp(lat + dLat, 90)].map(n => n.toFixed(3)).join(' '),
        };
      }

      // Cache the answer for an hour, so the shared key is not used up by repeat searches
      const cache = caches.default;
      const cacheKey = new Request(`${url.origin}/search?q=${encodeURIComponent(q)}&cc0=${cc0 ? 1 : 0}&page=${page}${near ? `&near=${near.lat},${near.lon}&km=${near.km}` : ''}`);
      const hit = await cache.match(cacheKey);
      if (hit) return json(await hit.json(), cors, 200, 'public, max-age=3600');

      const api = new URL(`${FS}/search/`);
      api.searchParams.set('query', q);
      api.searchParams.set('fields', FIELDS);
      api.searchParams.set('page_size', '15');
      api.searchParams.set('page', String(page));
      api.searchParams.set('token', env.FREESOUND_KEY);
      const filters = [];
      if (cc0) filters.push('license:"Creative Commons 0"');
      if (near) filters.push(`geotag:"Intersects(${near.box})"`);
      if (filters.length) api.searchParams.set('filter', filters.join(' '));

      const r = await fetch(api.toString(), { headers: { Accept: 'application/json' }, cf: { cacheTtl: 86400, cacheEverything: true } });
      if (!r.ok) return json({ error: `Freesound ${r.status}` }, cors, 502);
      const data = await r.json();
      const payload = {
        count: data.count || 0,
        page,
        results: (data.results || []).map(s => ({
          id: s.id,
          name: s.name,
          user: s.username,
          seconds: s.duration,
          licence: s.license,
          page: s.url,
          preview: (s.previews && (s.previews['preview-hq-mp3'] || s.previews['preview-lq-mp3'])) || null,
          previewLq: (s.previews && (s.previews['preview-lq-mp3'] || s.previews['preview-hq-mp3'])) || null,   // smaller file, quicker to audition
        })),
      };
      ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(payload), { headers: { 'Cache-Control': 'public, max-age=3600' } })));
      return json(payload, cors, 200, 'public, max-age=3600');
    }

    return new Response('Not found', { status: 404 });
  },
};