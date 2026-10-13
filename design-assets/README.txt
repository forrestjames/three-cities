THREE CITIES · DESIGN KIT
=========================

fonts/    Abel and Source Code Pro (Regular, Medium) as .ttf. Install these first,
          so Figma and the SVG lockups show the right type. Both are free under the
          SIL Open Font License (licences included).
logo/     The skyline mark (ink, dark, ember, and one colour per city) and the
          full lockup on dark, light and transparent. All vector SVG, with the type
          already outlined. The -text versions keep the words as live text to edit.
icons/    Favicon (SVG), app icons (180, 192, 512) and the social share image.
tokens/   tokens.json for the Tokens Studio Figma plugin, and tokens.css for code.
          Colours, type styles, radii and spacing.
screens/  The app as it is today, desktop (2x) and phone (3x). Use as reference,
          or import them and trace.

Getting it into Figma
1. Install the fonts in fonts/.
2. Drag the SVGs from logo/ straight onto the canvas. They stay editable vectors.
3. For editable screens, run the html.to.design plugin in Figma and paste
   https://threecities.forrestjamesmusic.com (try /manual and /design too).
   It turns the live page into Figma frames with real text and colours.
4. For colours and type styles, open the Tokens Studio plugin, choose
   Load from file, and pick tokens/tokens.json. Then create styles from it.

The living version of all this is at /design.
