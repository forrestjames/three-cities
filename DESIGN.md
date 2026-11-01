# Three Cities design

Read this before changing anything people see or hear about. It is the short version. The detail is in `design-assets/spec/`, and the living version is the `/design` page.

## The idea
Three places Jim has called home (Boston, Copenhagen, London), playing in real time from live weather. Playful, musical, warm. Not a dashboard.

## Source of truth
- Colours, type, radii, spacing: `design-assets/tokens/tokens.css` (and `tokens.json` for Figma). Use the variables. Do not type a hex.
- Logo, icons, fonts: `design-assets/logo`, `icons`, `fonts`.
- What the app looks like today: `design-assets/screens/`.
- The live reference: `/design` (`design.html`).

## The rules that matter most
1. **One accent at a time.** Ember is the accent. City colours (Boston terracotta, Copenhagen green, London lilac) belong to their city only.
2. **Two faces.** Abel for anything you read from across the room. Source Code Pro for everything up close.
3. **Corners.** 3 for LCD screens, 16 for cards and pedals, 17 for chips, 22 for panels. Big buttons stay square.
4. **Spacing scale.** 4, 8, 14, 22, 34. Phone side gutter is 16. Rounded panels get 30 to 34 inside.
5. **Texture over flat fills.** Risograph grain and soft colour blobs in the hero. Pedals get a faint brushed stripe and a top-to-bottom gradient.
6. **Voice.** Warm and plain. Short sentences. No em dashes. See `design-assets/spec/voice-and-copy.md`.
7. **Weather is the star.** The musical result matters as much as the screen. Never change how it sounds for a visual reason.

## Specs
- `design-assets/spec/brand-logo.md`
- `design-assets/spec/brand-imagery.md`
- `design-assets/spec/voice-and-copy.md`

## Checks
Run from the repo root. They print a summary and exit 0, so they work as a nudge. Add `--strict` to make them fail.

```
node checks/check-hardcoded.mjs   # hex colours that are not tokens
node checks/check-spacing.mjs     # padding, margin, gap off the scale
node checks/check-copy.mjs        # em dashes and words Jim does not say
```

Pass file names to check just those. Then walk `checks/review-checklist.md` before calling a change done.

## When a rule is wrong
Change the rule here, in the spec or in the tokens, and say why. Do not quietly break it in one page.
