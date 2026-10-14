// Makes today's reel with the live site, the same way you would by hand:
// opens the Reel Studio, takes its pick of theme and cities, opens the reel and records it.
// Keeps its own memory (episode number, cities resting for two weeks) in state.json on the "daily" branch.
import { chromium } from "playwright";
import fs from "node:fs";

const SITE = process.env.SITE || "https://threecities.forrestjamesmusic.com";
const OUT = process.env.OUT || "out";
const RAW = "https://raw.githubusercontent.com/forrestjames/three-cities/daily/state.json";
fs.mkdirSync(OUT, { recursive: true });

let state = { ep: Number(process.env.START_EP) || 1, recent: [] };
try { const r = await fetch(RAW + "?t=" + Date.now()); if (r.ok) state = Object.assign(state, await r.json()); } catch (e) {}
const now = Date.now();
state.recent = (state.recent || []).filter(x => now - x.t < 14 * 864e5);
console.log("episode", state.ep, "resting", state.recent.map(x => x.name).join(", ") || "none");

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: "en-GB", timezoneId: "Europe/London", acceptDownloads: true });
await ctx.addInitScript(([recent, ep]) => {
  try { localStorage.setItem("reel-recent", recent); localStorage.setItem("reel-episode", ep); } catch (e) {}
}, [JSON.stringify(state.recent), String(state.ep)]);
const page = await ctx.newPage();
page.on("pageerror", e => console.log("page error:", e.message));

// 1. the studio picks today's theme and cities from the live weather
await page.goto(SITE + "/reel", { waitUntil: "domcontentloaded" });
await page.waitForSelector('#open[aria-disabled="false"]', { timeout: 180000 });
const pick = await page.evaluate(() => ({
  href: document.getElementById("open").getAttribute("href"),
  caption: document.getElementById("caption").value,
  title: (document.getElementById("caption").value.split("\n")[0] || "").replace(/\.$/, ""),
  cities: [...document.querySelectorAll("#picks .pick .name")].map(e => e.textContent.trim())
}));
console.log("theme:", pick.title, "|", pick.cities.join(", "));

// 2. open the reel and wait until the weather, photos and sound are ready
await page.goto(new URL(pick.href, SITE).href, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => /^Ready\./.test(document.querySelector(".reel-status")?.textContent || ""), null, { timeout: 180000 });
await page.waitForTimeout(1500);

// 3. record it: the reel saves itself as a download when it's done
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 120000 }),
  page.click('.reel-bar [data-a="record"]')
]);
const name = download.suggestedFilename(), ext = name.split(".").pop();
await download.saveAs(`${OUT}/raw.${ext}`);
console.log("recorded", name);
await browser.close();

// 4. what the /today page and tomorrow's run need
state.ep += 1;
pick.cities.forEach(n => { if (!state.recent.some(x => x.name === n)) state.recent.push({ name: n, t: now }); });
const date = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
fs.writeFileSync(`${OUT}/caption.txt`, pick.caption);
fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify({ date, made: new Date().toISOString(), title: pick.title, cities: pick.cities, episode: state.ep - 1, rawExt: ext }, null, 1));
fs.writeFileSync(`${OUT}/state.json`, JSON.stringify(state, null, 1));
