# Reels: daily reel and Reel Studio

Internal notes for the social reel tools. No manual coverage needed.

## Pages
- reel.html (/reel) is the Reel Studio for daily social posts. Noindex, not linked. Reel mode lives in index.html behind ?reel=.
- today.html (/today) shows the daily reel and posts it through the phone share sheet. Noindex.
- Instagram safe zone: keep text and key art clear of the top ~290px, the right strip from y 1040, and the bottom ~360px. Content stays in x 80–1000 (80–880 below y 1040) and y 330–1550.

## Daily reel pipeline
- .github/workflows/daily-reel.yml runs at 8am London. It has two UTC crons (07:00 and 08:00) and only carries on when it is 8am in London.
- It opens /reel with Playwright, records the reel, converts it to MP4 with ffmpeg, then force-pushes reel.mp4, poster.jpg, caption.txt, meta.json and state.json to the orphan `daily` branch. Only today's reel is kept.
- daily-reel/make-reel.mjs does the recording. It keeps its memory (episode number, cities resting for 14 days) in state.json on the `daily` branch.
- Episode numbers: state.json holds `ep`. The START_EP env var only seeds it when there is no state yet. To change the number, edit state.json on the `daily` branch.
- today.html loads the files from raw.githubusercontent.com (CORS allowed).
- Touch daily-reel/run-now and push to run it straight away.
- Posting needs a phone with navigator.canShare({ files }). Otherwise use Save video.

## Reel photos and colour
- photosFor() picks themed photo queries, scores them, filters BAD results and needs at least 900px wide.
- tintOf(c) blends THEME_TINT 60/40 with the city colour.
- weatherOf(c, k) feeds the reel's weather lines.
