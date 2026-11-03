# Chiaroscuro reel look: spec

An alternative look for the Three Cities daily reel. Same music, same three cities, same weather. Choose it in the Reel Studio's Look menu ("Chiaroscuro"), or add `&rl=chiaro` to the reel address.

## Fixed across every city
- Near-black frame (#040404).
- One shaft of light from the top, tapering to the lower third.
- No figure or silhouette.
- Fog bands in the lower third, drifting slowly.
- No text except the city name, small, in the top left under the safe zone.
- Each city has its own slot in the timeline and holds in the dark. It fades in from black and out again. There are no cuts.
- After the three city slots, the closing section shows the three shafts side by side, all playing together.
- Title and end card are the same as the other looks.

## Driven by live weather
| Parameter | Weather field | Low | High |
|---|---|---|---|
| Light colour | temperature, °C (`c.w.t`) | cold blue-white (#cfe3ff) at -5°C | warm amber (#f2a33a) at 30°C |
| Shaft brightness | cloud cover, % (`c.w.c`) | brighter on clear days | dimmer under heavy cloud |
| Fog density | humidity, % (`c.w.h`) | thin haze | thicker bands |
| Shaft flicker | the city's beat (`_reelPulse`) | none | a small brightening on each hit |

## Known gaps against the original brief
- Each city slot is 5 seconds, because the reel's timeline (26 seconds) is shared by all looks. The brief asked for holds of at least 6 seconds.
- Fog is a subtle haze, not strong bands. Raise the strength in `chiaro()` if you want it more visible.

## Where it lives
- `index.html`: the `chiaro()` helper and the two `rLook === "chiaro"` scene branches.
- `reel.html`: the Look menu option and its name.
- `daily-reel/make-reel.mjs` is unchanged, so the daily run still uses its automatic look. Chiaroscuro is only chosen by hand for now.
