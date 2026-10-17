THREE CITIES · MAX FOR LIVE · v2
================================

START HERE
----------
Open "Three Cities Manual.pdf". Page 2 is a four step quick start. Page 3 shows both
devices with every control labelled. The rest shows what you can do in Live.

What's in here
--------------
Three Cities Manual.pdf  The visual manual and quick start (8 pages).
City Track.amxd       MIDI effect. One per MIDI track, set to City 1, 2 or 3.
City Dashboard.amxd   Audio effect. One anywhere in the set: the picture of all three
                      cities, plus where you choose the cities, key and scale.
city_track.js         \
city_dashboard.js      } the code the devices run. Keep these in the SAME FOLDER
city_weather.js       /  as the two .amxd files (or anywhere in Max's search path).
*.maxpat              the same devices as plain patches, for editing.

Install
-------
1. Put this whole folder somewhere permanent, e.g. Music/Ableton/User Library/Three Cities v2.
2. Drag City Dashboard onto any track (an empty audio track or the master is fine).
3. Make three MIDI tracks with an instrument each. Drag City Track onto each one,
   in front of the instrument, and set the City menu to City 1, City 2 and City 3.
4. Press play in Live. Turn Mode to Melody to hear the shared key and chords.
Tip: once it works, use Freeze Device in each device's Max editor so the .js files
travel inside the .amxd and you can move them anywhere.

Choosing cities, key and scale
------------------------------
On the City Dashboard, type three places into the Cities box, separated by
slashes or commas ("New York / Tokyo / Lima"), and press Return. Pick Key and Scale
from the menus. Every City Track in the set follows within a couple of seconds:
the devices share a small settings file in your home folder (.three-cities.json).

Updated 17 October 2026
-----------------------
- Chords change: a new menu on City Dashboard sets how often the chord moves: every
  4, 8, 16 or 32 bars, or Drone, which holds the home chord. Every City Track follows.
- A high line (Note 62 or above) leans onto the chord more often, as in the web version.
- Weather fetching is more patient: three tries per city, all three at once, and a city
  that can't be reached keeps its last weather and says when it will try again.
- Menu changes are saved with your Live set. Open an old set and set Chords change once.

What's new in v2 (brought over from the web version)
----------------------------------------------------
- Any cities, not just Boston, Copenhagen and London.
- Melody mode: each hit walks the shared scale and leans onto a chord progression
  that moves every 4 bars (or as set by Chords change) of Live's song position, so all tracks agree.
  Calm air takes small steps, wind makes it leap, humid air repeats notes.
  Rhythm mode is the old behaviour: one note, the weather's rhythm.
- Sleep: after sunset a city drifts off over two hours (more rests, softer notes),
  moves at half speed in deep sleep, and stirs before sunrise.
- Chance of rain this hour thins the line, up to a third of notes resting.
- Rate: Auto. Settled high pressure plays in 1/8s, otherwise 1/16s.
- Flourishes: unsettled weather (low or falling pressure, gusts) adds quick
  doubles and little runs.
- Lead swell: the three cities take turns being up front, a minute or two each.
  It follows the clock, so every device agrees without talking to the others.
- CC1 is still the sun's arc. New: CC74 is brightness (the sun, darker asleep).
  Map them to a filter in your instruments.
- Dashboard: any cities, colours to match the web version, "drifting off" and "asleep".

Left out on purpose (the web version has them; here your instruments and Live do the job better)
-----------------------------------------------------------------------------------------------
- Sounds, reverb, delay, the DJ filter, recording: use your own instruments,
  effects and Live's recording.
- The rhythm section: use the web version's MIDI out to a drum rack, or ask for a
  "City Drums" device later. It's the most worthwhile next addition.
- Memory map and tempo slowing at night (Live owns the tempo).

If something goes wrong
-----------------------
The display lines on City Track say what's happening ("waiting for weather",
"Couldn't find …"). Max's console shows anything else. The weather needs an
internet connection; it refreshes every 10 minutes.
