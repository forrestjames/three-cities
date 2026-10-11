// Records today's Three Cities as a vertical clip for TikTok, Instagram Reels and Shorts.
//
//   node tools/capture.mjs [--seconds 40] [--out clips] [--url https://...] [--allow-snapshot]
//
// Serves the page from this repo (or opens --url), loads it with ?record, waits for the live
// weather, lets the page record its own 9:16 frame with the finished mix, then uses ffmpeg to
// turn that into an MP4 with soft fades and even loudness. Writes the MP4 and a caption file.
// Needs Node 18+, Playwright's Chromium (npx playwright install chromium) and ffmpeg.

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, join, normalize, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : fallback; };
const flag = name => args.includes("--" + name);
const seconds = Number(opt("seconds", 40));
const outDir = resolve(opt("out", "clips"));
const allowSnapshot = flag("allow-snapshot");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// a tiny static server for the repo, so the clip always matches the code in this checkout
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".mp3": "audio/mpeg", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json" };
function serve() {
  const server = createServer(async (req, res) => {
    try {
      let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
      if (p === "" || p.endsWith("/")) p += "index.html";
      const file = join(root, p);
      if (!file.startsWith(root)) throw new Error("outside");
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, "127.0.0.1", () => r(server)));
}

const date = new Date().toISOString().slice(0, 10);
await mkdir(outDir, { recursive: true });
const server = opt("url") ? null : await serve();
const base = opt("url") || `http://127.0.0.1:${server.address().port}/`;
const url = base + (base.includes("?") ? "&" : "?") + "record";

const browser = await chromium.launch({
  executablePath: opt("chrome") || process.env.CHROME_PATH || undefined,
  args: ["--autoplay-policy=no-user-gesture-required"]
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  page.on("pageerror", e => console.error("page error:", e.message));
  console.log("opening", url);
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.threeCities && window.threeCities.ready(), null, { timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
  const live = await page.evaluate(() => window.threeCities.live());
  if (!live && !allowSnapshot) throw new Error("Couldn't reach the live weather, so no clip today (use --allow-snapshot to record anyway).");
  if (!live) console.warn("recording with the built-in snapshot weather, not today's");

  console.log(`recording ${seconds}s in real time...`);
  const download = page.waitForEvent("download", { timeout: (seconds + 60) * 1000 });
  const result = await page.evaluate(s => window.threeCities.record(s), seconds);
  const raw = join(outDir, `three-cities-${date}.webm`);
  await (await download).saveAs(raw);
  console.log(`recorded ${(result.bytes / 1e6).toFixed(1)} MB`);

  // MP4 for the apps: H.264 + AAC, fade in and out, loudness levelled to what the platforms play at
  const mp4 = join(outDir, `three-cities-${date}.mp4`);
  const end = seconds - 0.2;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
    "-t", String(end),
    "-vf", `fps=30,format=yuv420p,fade=t=in:st=0:d=0.8,fade=t=out:st=${end - 1.5}:d=1.5`,
    "-af", `afade=t=in:st=0:d=1.2,afade=t=out:st=${end - 2}:d=2,loudnorm=I=-14:TP=-1.5:LRA=11`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart", mp4], { stdio: "inherit" });

  await writeFile(join(outDir, `three-cities-${date}.txt`), result.caption + "\n");
  console.log("wrote", mp4);
  console.log("\n" + result.caption);
} finally {
  await browser.close();
  if (server) server.close();
}
