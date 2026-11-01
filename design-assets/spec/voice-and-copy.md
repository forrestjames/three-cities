# Voice and copy

Anything people read sounds like Jim talking: warm, plain, short sentences.

## Rules
- Short sentences. Plain words.
- No em dashes. Use a full stop or a comma.
- No corporate framing. No hype.
- Understated closes. Don't oversell the ending.
- Skip copywriter words Jim doesn't say, like "lands", "magic", "seamless", "unlock", "immersive", "soundscape".
- Buttons: caps, short, say what happens. "Hear my three cities", "Play any", "Record", "Share".

## Like this
- Three places I've called home, playing in real time.
- Been there or not, go with your gut.
- You can replace my cities with your own and hear a different personal map.

## Not this
- Experience a revolutionary generative soundscape.
- Watch the magic land.

## Where it shows up
- Hero and intro lines, quiz questions, the manual, press pitches, captions, reels.
- The manual is `manual.html`. Every change to features, controls, sounds, defaults or behaviour updates it in the same commit, with a dated line in "What's new".

## Check it
`node checks/check-copy.mjs` catches em dashes and the words above. It cannot catch tone, so read it out loud.
