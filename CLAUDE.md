# Three Cities: working notes

- Source of truth for the app is /home/claude/three-cities/index.html (a fragment); build the repo copy with the scratchpad build_repo.py, then commit and push here.
- The user manual is manual.html in this repo, served at /manual.
- **Rule: every change to features, controls, sounds, defaults or behaviour must update manual.html in the same commit** — the relevant section, plus a dated line at the top of "What's new". If a change is purely internal (a bug fix with no visible difference), a short "Fixed …" line in What's new is still welcome.
- Write in Forrest's voice: warm, plain, short sentences, no em dashes.

- reel.html (/reel) is Forrest's internal Reel Studio for daily social posts (noindex, not linked). Reel mode lives in index.html behind ?reel=. Neither needs manual coverage.

- Daily reel: .github/workflows/daily-reel.yml runs at 8am London (crons at 07:00 and 08:00 UTC, guarded), opens /reel with Playwright, records the reel, converts to MP4 with ffmpeg and force-pushes reel.mp4, poster.jpg, caption.txt, meta.json and state.json (episode, resting cities) to the orphan `daily` branch. today.html (/today, noindex) loads them from raw.githubusercontent.com and posts via the share sheet. Touch daily-reel/run-now to run it straight away. No manual coverage needed.
