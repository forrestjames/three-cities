# Rhythm Atlas (work in progress)

A sibling to Three Cities. Drum patterns mapped to the cities they come from, played by each city's live weather.

- `rhythm-atlas.json` is the data: 268 patterns from Paul Wenzel's *Pocket Operations* as 16-step grids, 142 of them tied to a city, plus 11 Euclidean rhythms (after Godfried Toussaint) for places the book doesn't cover. 30 cities in all, each with coordinates and a timezone.
- `build_rhythm_atlas.py` builds the JSON. Edit the cities, tempos or confidence ratings there and run `python3 build_rhythm_atlas.py`.

Check the book's licence and credit Paul Wenzel before this goes public.
