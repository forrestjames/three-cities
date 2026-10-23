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
- Ask before destructive changes. Commit and push to main as you go while the app is not live (temporary, set by Forrest on 23 Oct 2026; change back to the rule below when it goes live). Once live: commit locally as you go, and push to main only when Forrest says "push" (or clearly asks for it live).

## Design principles
- Aim for playful, musical and visually distinctive. Avoid generic AI dashboard looks.
- Keep layouts responsive and controls accessible.
- Treat the musical result as importantly as the visual interface.

## Communication
- Explain trade-offs simply. Recommend one solution rather than a long list.
- Be concise unless deeper explanation is asked for.
- Write in Forrest's voice for anything users read: warm, plain, short sentences, no em dashes.

## Key files
- index.html: the app fragment, source of truth at /home/claude/three-cities/index.html. Build the repo copy with build_repo.py.
- manual.html: the user manual, at the repo root.
- Weather: fetchCity() and getJSON() in index.html (Open-Meteo forecast and geocoding). Search by name, not line number.
- Euclidean rhythm mapping: euclid() and rebuild() in index.html. Steps come from temperature, hits from the amount and density settings.
- Audio / Max patch: /home/claude/Three Cities M4L v2/ (City Track and City Dashboard .amxd devices and their .js files). Not in the repo. Do not edit without asking.
- quiz-worker/worker.js: Cloudflare Worker. Forrest pastes it into the Cloudflare editor himself.
- .github/workflows/daily-reel.yml: daily reel automation. Details in @REEL.md.

## Project setup
- Source of truth for the app is /home/claude/three-cities/index.html (a fragment). Build the repo copy with the scratchpad build_repo.py (it adds the head metadata), then commit in the repo.
- Commit messages end with the Co-Authored-By and Claude-Session lines from the session.

## The user manual
- manual.html is the user manual, served at /manual.
- **Rule: every change to features, controls, sounds, defaults or behaviour must update manual.html in the same commit.** Update the relevant section, plus a dated line at the top of "What's new". For a purely internal bug fix, a short "Fixed …" line in What's new is still welcome.

## Internal pages (noindex, no manual coverage)
- admin.html (/admin) is the internal hub: links to every page plus the city quiz results.
- dashboard.html (/dashboard) is an identical copy of admin.html under a fresh name, made on 21 Oct because /admin was stuck in a cache. Keep the two the same, or delete it once /admin refreshes.
- design.html (/design) is the design system page, with the kit in design-assets/ (fonts, logos, icons, tokens, screens, and a zip). Rebuild the zip when assets change.
- perform.html (/perform) forwards to /?perform, the performance surface built into index.html (body.perform). Listed in admin; the manual covers it.
- graphics.html (/graphics) is the library of every launch and social graphic and its earlier versions, with PNG, MP4 and Figma SVG links. Rebuild it with launch-graphics/build_graphics_page.py after adding or re-rendering graphics. Linked from admin.
- reel.html and today.html (the reel tools) are covered in REEL.md.

## Quiz server
- Lives in quiz-worker/ (Cloudflare Worker three-cities-quiz.jim-4cc.workers.dev + D1 "three-cities-quiz"). The ADMIN_KEY secret locks /stats and is Forrest's alone.
- Question ids must match in index.html (QUIZ) and worker.js. Forrest pastes worker.js into the Cloudflare editor himself.

## Reels
- See @REEL.md for the Reel Studio, the daily reel pipeline and its notes.
