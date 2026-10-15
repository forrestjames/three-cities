# Three Cities

Three Cities is an interactive generative music project that turns live weather from Boston, Copenhagen and London (or any three cities) into Euclidean rhythms. Live at threecities.forrestjamesmusic.com.

## Working principles
- Keep solutions simple, maintainable and right for a solo developer.
- Preserve existing musical behaviour unless a change is explicitly requested.
- Inspect the relevant code before suggesting changes.
- For changes that span several files, propose a plan before building.
- Make small, focused changes and explain them in plain English.
- Reuse existing components and dependencies where practical.
- Do not add packages without explaining why they are needed.
- Run relevant checks where available (Playwright against a local copy). Report anything not tested.
- Never commit secrets, API keys or credentials. Never ask for the quiz ADMIN_KEY.
- Ask before destructive changes. Commit locally as you go, but push to main only when Forrest says "push" (or clearly asks for it live).

## Design principles
- Aim for playful, musical and visually distinctive. Avoid generic AI dashboard looks.
- Keep layouts responsive and controls accessible.
- Treat the musical result as importantly as the visual interface.

## Communication
- Explain trade-offs simply. Recommend one solution rather than a long list.
- Be concise unless deeper explanation is asked for.
- Write in Forrest's voice for anything users read: warm, plain, short sentences, no em dashes.

## Project setup
- Source of truth for the app is /home/claude/three-cities/index.html (a fragment). Build the repo copy with the scratchpad build_repo.py (it adds the head metadata), then commit in the repo.
- Commit messages end with the Co-Authored-By and Claude-Session lines from the session.

## The user manual
- manual.html is the user manual, served at /manual.
- **Rule: every change to features, controls, sounds, defaults or behaviour must update manual.html in the same commit.** Update the relevant section, plus a dated line at the top of "What's new". For a purely internal bug fix, a short "Fixed …" line in What's new is still welcome.

## Internal pages (noindex, no manual coverage)
- reel.html (/reel) is the Reel Studio for daily social posts, not linked. Reel mode lives in index.html behind ?reel=.
- admin.html (/admin) is the internal hub: links to every page plus the city quiz results.
- design.html (/design) is the design system page, with the kit in design-assets/ (fonts, logos, icons, tokens, screens, and a zip). Rebuild the zip when assets change.
- today.html (/today) shows the daily reel and posts it through the phone share sheet.

## Quiz server
- Lives in quiz-worker/ (Cloudflare Worker three-cities-quiz.jim-4cc.workers.dev + D1 "three-cities-quiz"). The ADMIN_KEY secret locks /stats and is Forrest's alone.
- Question ids must match in index.html (QUIZ) and worker.js. Forrest pastes worker.js into the Cloudflare editor himself.

## Daily reel
- .github/workflows/daily-reel.yml runs at 8am London (crons at 07:00 and 08:00 UTC, guarded), opens /reel with Playwright, records the reel, converts to MP4 with ffmpeg and force-pushes reel.mp4, poster.jpg, caption.txt, meta.json and state.json (episode, resting cities) to the orphan `daily` branch.
- today.html loads those from raw.githubusercontent.com. Touch daily-reel/run-now to run it straight away. The START_EP env var seeds the episode number.
