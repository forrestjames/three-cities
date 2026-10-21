"""Builds rhythm-atlas.json from the patterns in Pocket Operations (Paul Wenzel)
plus Euclidean rhythms (Toussaint, 2005) for regions the book doesn't cover."""
import json, re

ODD = "1 3 5 7 9 11 13 15"
ALL = "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16"

BOOK = """
## Basic Patterns
ONE AND SEVEN & FIVE AND THIRTEEN
BD 1 7
SN 5 13

BOOTS N' CATS
BD 1 9
SN 5 13
CH ODD

TINY HOUSE
OH 3 7 11 15
BD 1 5 9 13

GOOD TO GO
BD 1 4 7 11
SN 5 13

HIP HOP
BD 1 3 7 8 15
SN 5 13
CH ODD

## Standard Breaks
STANDARD BREAK 1
BD 1 11
SN 5 13
CH 1 3 5 7 9 10 11 13 15

STANDARD BREAK 2
BD 1 11
SN 5 13
CH 1 3 5 7 8 9 11 15

ROLLING BREAK
BD 1 8 11
SN 5 13
CH ODD

THE UNKNOWN DRUMMER
BD 1 4 7 11
SN 2 5 8 13
CH 2 3 5 6 8 14
OH 9 15

## Rock
ROCK 1
BD 1 8 9 11
SN 5 13
CY 1
CH ODD

ROCK 2
BD 1 8 9 11
SN 5 13
CH ODD

ROCK 3
BD 1 8 9 11
SN 5 13
OH 15
CH ODD

ROCK 4
BD 1 8 9 11
SN 5 13 15 16
OH 15
CH ODD

## Electro
ELECTRO 1 - A
SN 5 13
BD 1 7

ELECTRO 1 - B
SN 5 13
BD 1 7 11 15

ELECTRO 2 - A
SN 5 13
BD 1 7

ELECTRO 2 - B
SN 5 13
BD 1 11 14

ELECTRO 3 - A
SN 5 13
BD 1 7 12

ELECTRO 3 - B
SN 5 13
BD 1 7 12 14

ELECTRO 4
SN 5 13
BD 1 7 11 14

SIBERIAN NIGHTS
CH 1 3 4 5 7 8 9 11 12 13 15 16
SN 5 13
BD 1 7

NEW WAVE
BD 1 7 9 10
SN 5 13
CH ALL
OH 3
SH 5 13

## House
HOUSE
BD 1 5 9 13
SN 5 13
CY 1
OH 3 7 11 15

HOUSE 2
BD 1 5 9 13
SN 5 13
CH ALL
OH 3 6 11 14

BRIT HOUSE
BD 1 5 9 13
CL 5 13
CY 3 7 11 15
CH 1 2 4 5 6 8 9 10 12 13 14 16
OH 3 7 11 15

FRENCH HOUSE
BD 1 5 9 13
CL 5 13
SH 1 2 3 5 7 8 9 10 11 13 15 16
CH ALL
OH 2 4 6 8 10 12 14 16

DIRTY HOUSE
BD 1 3 5 9 11 13 16
SN 5 13
CL 3 5 9 11 13
CH 11 16
OH 3 11 15

DEEP HOUSE
BD 1 5 9 13
CL 5 13
CH 2 8 10
OH 3 7 11 15

DEEPER HOUSE
BD 1 5 9 13
CL 2 10
MT 3 8 11
SH 4 9
OH 3 7 11 12 15

SLOW DEEP HOUSE
BD 1 5 9 13
CL 5 13
SH ALL
CH 1 5 9 13
OH 3 4 7 8 10 11 13

FOOTWORK - A
BD 1 4 7 9 12 15
CL 13
CH 3 11
RS ALL

FOOTWORK - B
BD 1 4 7 9 12 15
CL 13
CH 3 7 8 11 15
RS ALL

## Miami Bass
MIAMI BASS - A
BD 1 7
SN 5 13
CH 1 3 4 5 7 8 9 11 12 13 15 16

MIAMI BASS - B
BD 1 7 11 14
SN 5 13
CH 1 3 4 5 7 8 9 11 12 13 15 16

SALLY
BD 1 7 11 15
SN 5 13
LT 1 7 11 15
CH ODD

ROCK THE PLANET
BD 1 4 7
SN 5 13
CH 1 3 4 5 7 8 9 11 12 13 14 15 16

## Hip Hop
HIP HOP 1 - A
BD 1 7 8 12 15
SN 5 13

HIP HOP 1 - B
BD 1 8 12
SN 5 13

HIP HOP 2 - A
BD 1 8 9 10 14 16
SN 5 13

HIP HOP 2 - B
BD 1 8 9 12
SN 5 10 13

HIP HOP 3 - A
BD 1 3 9 11
SN 5 13

HIP HOP 3 - B
BD 1 3 9 10 12
SN 5 13

HIP HOP 4 - A
BD 1 4 8 10 11 16
SN 5 13

HIP HOP 4 - B
BD 1 3 8 9 10 11
SN 5 13

HIP HOP 5
BD 1 3 8 9 11 16
SN 5 13

HIP HOP 6
BD 1 3 11 12 16
SN 5 13
CH ODD

HIP HOP 7
BD 1 8 11 14 16
SN 5 13
CH ODD

HIP HOP 8
BD 1 4 9 11 12
SN 5 13
CH 1 2 4 5 7 8 9 10 12 13 15 16
OH 6 14

TRAP - A
BD 1 7 13
SN 9
CH ODD

TRAP - B
BD 3 5
SN 9
CH 3 5 7 9 11 15

PLANET ROCK - A
CH 1 3 4 5 7 8 9 11 12 13 14 15 16
CB 1 3 5 7 8 10 12 13 15
SN 5 13
BD 1 7
HC 5 13

PLANET ROCK - B
CH 1 3 4 5 7 8 9 11 12 13 14 15 16
CB 1 3 5 7 8 10 12 13 15
SN 5 13
BD 1 7 11 14
HC 5 13

INNA CLUB
OH ODD
SN 5 13
BD 3 8 11 16
HC 5 13

ICE
SN 5 13
BD 1 7 11 15
SH ODD

BACK TO CALI - A
CH ODD
SN 5 13
BD 1 7
HC 5 7 9 13 15

BACK TO CALI - B
CH 1 3 5 7 9 11 15
OH 13
SN 5 13
BD 1 7 11 14
HC 1 5 7 9 13

SNOOP STYLES
RS 3 6 9 12
OH 1 4 7 11
SN 5 13
BD 1 4 7 11
HC 5 13

THE GROOVE - A
CH ODD
OH 8
SN 5 13
BD 1 4 8 12 15
SH 5 13

THE GROOVE - B
CH 1 3 5 7 9 11 13 14
OH 8 11 12 13 15
SN 5 13
HT 10 11
MT 12 14
LT 15 16
BD 1 4 8 12
SH 5 13

BOOM BAP
CB 9
OH 15
CH ALL
CL 3 7 11 15
SN 3 7 11 15
BD 1 3 6 10 14

MOST WANTED - A
CH ODD
CY 1
SN 5 13
BD 1 7 9 10 16
HC 5 13

MOST WANTED - B
CH 1 5 7 9 11 13 15
OH 3
SN 5 13
BD 3 7 9 10
HC 5 13

## Funk and Soul
AMEN BREAK - A
BD 1 3 11 12
SN 5 8 10 13 16
CH ODD

AMEN BREAK - B
BD 1 3 11 12
SN 8 10 13 16
CH ODD
RS 5

AMEN BREAK - C
BD 1 3 11
SN 8 10 13 16
CH ODD
RS 15

AMEN BREAK - D
BD 1 3 11
SN 2 5 8 10 15
CH 1 3 5 7 9 13 15
CY 11

THE FUNKY DRUMMER
BD 1 3 7 11 14
SN 5 8 10 12 13 16
CH 1 2 3 4 5 6 7 9 10 11 12 13 15 16
OH 8 14

IMPEACH THE PRESIDENT
BD 1 8 9 15
SN 5 13
CH 1 3 5 7 8 9 13 15
OH 11

WHEN THE LEVEE BREAKS
BD 1 2 8 11 12
SN 5 13
CH ODD

IT'S A NEW DAY
BD 1 3 11 12 16
SN 5 13
CH ODD

THE BIG BEAT
BD 1 4 7 9
SN 5 13
CH 5 13

ASHLEY'S ROACHCLIP
BD 1 3 7 9 10
SN 5 13
CH 1 3 5 7 9 13 15
OH 11
CB ODD

PAPA WAS TOO
BD 1 8 9 11 16
SN 5 13
CH 5 9 11 13 15 16
CY 5

SUPERSTITION
BD 1 5 9 13
SN 5 13
CH 1 3 5 7 8 9 10 11 13 15 16

CISSY STRUT - A
BD 1 4 6 10 12 13 15
SN 5 8 10 11
CY 13 15

CISSY STRUT - B
BD 1 4 8 10 12 13 15
SN 3 6 7 9 10

CISSY STRUT - C
BD 1 5 8 10 12 13 15
SN 3 5 6 7 10
CY 13 15

CISSY STRUT - D
BD 1 5 8 10 12 13 15
SN 1 3 6 9 10
CY 13 15

HOOK AND SLING - A
BD 1 3 10 14 15
SN 5 7 8 11 13
CY 1 3 4 6 9 10 12 15

HOOK AND SLING - B
BD 15
SN 1 5 6 8 11 12 15 16
CY 1 2 4 7 9 10 13 15

HOOK AND SLING - C
BD 1 2 13 14 16
SN 3 5 7 8 11 12 15
CY 1 3 5 6 8 10 13 14

HOOK AND SLING - D
BD 1 3 6 12 14 15
SN 5 8 11 16
CY 1 3 5 6 8

KISSING MY LOVE - A
CY 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
SN 5 8 10 13
BD 1 2 4 12 15

KISSING MY LOVE - B
CY ALL
SN 5 8 10 13 16
BD 1 2 4 12 14

KISSING MY LOVE - C
CY ALL
SN 5 8 10 16
BD 1 2 4 11 13 14

KISSING MY LOVE - D
CY 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
SN 5 10 13
BD 1 4 12 15

KISSING MY LOVE - E
CY 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
SN 5 8 10 13
BD 1 12 14

LADY - A
CY 3 7
SN 5 6
BD 1 9 12 15

LADY - B
CY 3 7
SN 5 6 9
BD 1 12 15

KNOCKS ME OFF MY FEET - A
CY 1 3 7 8 10 11 15
SN 5 13
BD 1 3 5 8 9 11 13 16

KNOCKS ME OFF MY FEET - B
CY 1 3 7 8 10 11 15
SN 5 13
BD 1 3 5 8 9 11 13 16

THE THRILL IS GONE
CY ODD
SN 1 5 9 13
BD 8 9 11

POP TECH - A
CY 1 9
SN 5 13
BD 1

POP TECH - B
CY 1 9
SN 5 13
BD 2 14 15 16

YA MAMA - A
CY 5 13
BD 1 9

YA MAMA - B
CY 5 13
BD 1 8 9

COLD SWEAT - A
CY ODD
SN 5 8 15
BD 1 9 11

COLD SWEAT - B
CY ODD
SN 2 5 8 10 13
BD 3 9 11 15

I GOT YOU (I FEEL GOOD) - A
CY ODD
SN 5 13
BD 1 11

I GOT YOU (I FEEL GOOD) - B
CY ODD
SN 5 13
BD 3 7 11 15

THE SAME BLOOD
CY 1 3 5 7 8 9 11 12 13 15 16
SN 4 6 7 13 14 15
BD 1 2 9 10

GROOVE ME
CY ODD
SN 5 13
BD 1 4 5 8 9 10 12 14 16

LOOK-KA PY PY - A
CY ODD
SN 2 5 8 9 11 15
BD 1 4 6 11 14 15

LOOK-KA PY PY - B
CY ODD
SN 2 5 6 8 9 11 15
BD 1 4 6 8 9 11 14 15

USE ME - A
CY 1 3 5 6 7 8 9 10 11 13 14 15 16
SN 3 5 7 8 10 11 13 15 16
BD 1 5 13

USE ME - B
CY 1 2 3 5 6 7 8 9 10 11 13 14 15 16
SN 2 3 5 7 8 10 11 13 15 16
BD 5 8 11 13

USE ME - C
CY ALL
SN 5 8 10 13 16
BD 1 3 6 8 9 11 12 14 16

USE ME - D
CY 1 2 3 4 5 6 7 8 9 10 12 14 16
SN 5 8 16
BD 1 3 6 9 10 12 14 16

FUNKY PRESIDENT
CY ODD
SN 5 13
BD 1 4 8 10 11

GET UP - A
CY 1 3 5 7 8 9 11 13 15 16
SN 5 7 8 10 13 16
BD 1 11 15

GET UP - B
CY 1 3 5 7 8 9 11 13 15
SN 5 7 8 10 13 16
BD 1 11 15

EXPENSIVE SHIT
CY 1 3 4 5 7 8 9 11 12 13 15 16
SN 1 2 4 6 9 10 13 14
BD 4 7 15

CHUG CHUG CHUG-A-LUG
CY 1 3 5 6 7 9 10 11 13 15
SN 2 3 5 8 10 11 13
BD 1 4 6 8 10 12 15

THE FEZ - A
CY 3 7 11 15
SN 2 4 5 6 8 10 12 13 14 16
BD 1 9

THE FEZ - B
CY 3 7 11 15
SN 2 4 5 6 8 10 12 13 14 16
BD 1 9 12 15

ROCK STEADY
CY 1 3 5 7 8 9 11 13 15 16
SN 2 5 6 8 10 13 14 16
BD 3 5 8 11 13

SYNTHETIC SUBSTITUTION - A
CY ODD
SN 5 9
BD 1 3 8 10 11 12 16

SYNTHETIC SUBSTITUTION - B
CY ODD
SN 5 9
BD 1 3 8 10 11 12 16

COW'D BELL - A
CB 1 3 4 5 7 8 9 11 12 13 15 16
SN 2 4 5 6 8 10 12 13 14 16
BD 1 4 7 8 11 12 14 16

COW'D BELL - B
CB 1 3 4 5 7 8 9 11 12 13 15 16
SN 2 4 5 6 8 10 12 13 14 16
BD 1 3 4 8 9 11 12 14 16

PALM GREASE - A
CY 1 2 3 4 6 7 9 11 12 14 15
SN 5 8 10 13 16
BD 1 9 16

PALM GREASE - B
CY 1 3 11
SN 2 6 15
BD 3

O-O-H CHILD - A
CY 1 2 3 5 6 7 9 10 11 13 14 15
SN 2 4 5 7 8 10 12 13 14 16
BD 1 3 9 11 12

O-O-H CHILD - B
CY 1 2 3 5 6 7 9 10 11 13 14 15
SN 2 4 5 7 8 10 13 15
BD 1 3 9 11 12

LADY MARMALADE - A
CY ODD
SN 5 13
BD 1 3 7 9 15

LADY MARMALADE - B
CY ODD
SN 5 9
BD 13

HOT SWEAT - A
CY ODD
SN 5 8 9 10 13 15 16
BD 1 11

HOT SWEAT - B
CY 1 3 4 5 7 9 11 12 13 15
SN 2 4 5 6 8 10 12 13 14
BD 3 4 11 12 15

HAITIAN DIVORCE
CY 1 2 3 5 6 7 8 9 10 11 13 14 15 16
SN 2 5 7 8 10 13 15 16
BD 3 5 11 13

COME DANCING - A
CY ODD
SN 2 3 5 6 7 10 11 13 14 15
BD 1 8 9 16

COME DANCING - B
CY ODD
SN 2 5 6 10 13 14 15
BD 1 3 6 8 9 16

RESPECT YOURSELF - A
CY ODD
SN 5 11 13
BD 1 5 9 13

RESPECT YOURSELF - B
CY ODD
SN 5 9 11 13
BD 1 5 9 13

EXPRESS YOURSELF - A
CY ALL
SN 5 8 10 12 14 16
BD 1 4 9 12 15

EXPRESS YOURSELF - B
CY ALL
SN 5 8 10 12 13
BD 1 4 9 12 15

LET A WOMAN BE A WOMAN
CY ODD
SN 5 8 10 11 13 14
BD 3 9 11 12 14 15

LET A MAN BE A MAN
CY ODD
SN 5 8 10 12 13
BD 3 11 15

BOOKS OF MOSES - A
CY ODD
SN 5 13
BD 1 5 9 12

BOOKS OF MOSES - B
CY ODD
SN 5 13
BD 1 5 9

MOTHER POPCORN - A
CY 1 5 9 13
SN 5 8 10 15
BD 1 3 11

MOTHER POPCORN - B
CY 1 5 9 13
SN 2 4 5 6 8 10 12 13 14 16
BD 3 7 11 15

STRT BTS - A
CY 2 3 5 6 8 9 14 15
SN 2 5 8 12 13
BD 1 4 7 11

STRT BTS - B
CY 2 3 5 6 8 9 14 15
SN 2 5 8 13
BD 1 4 7 11

I GOT THE FEELIN' - A
CY ODD
SN 7 10 15
BD 1 3 11

I GOT THE FEELIN' - B
CY ODD
SN 2 5 6 8 10 11 12 14 15 16
BD 3 9 13 15

MORE BOUNCE TO THE OUNCE
CH 3 5 7 9 11 13 15
OH 1
HC 5 13
SN 5 13
BD 1 9 10

## Afro-Cuban
SON CLAVE
BD 1 4 5 8 9 12 13 16
RS 1 4 7 11 13
CY ALL

RUMBA
BD 1 4 5 8 9 12 13 16
RS 1 4 8 11 13
CY ALL

BOSSA NOVA
BD 1 4 5 8 9 12 13 16
RS 1 4 7 11 14
CY ALL

BOUTON
BD 1 9 11 15
RS 4 7 13
CH 1 3 4 5 7 9 11 13 15

GAHU
BD 1 5 9 13 15
RS 3 4 7 8 11 12 15 16
CB 1 4 7 11 15

SHIKO
BD 1 5 7 9 13 15
RS 3 4 7 8 11 12 15 16
CB 1 5 7 11 13

SOUKOUS
BD 1 5 9 13 15
RS 1 4 7 9 12 15
CB 1 4 7 10 11

## Drum and Bass
DRUM AND BASS 1 - A
BD 1 4 8 10 11 16
SN 5 13
CH ODD

DRUM AND BASS 1 - B
BD 1 3 8 9 10 11
SN 5 13
CH ODD

DRUM AND BASS 2 - A
BD 1 8 10 12 16
SN 5 13
CH ODD

DRUM AND BASS 2 - B
BD 1 12
SN 5 13
CH 1 3 5 7 9 11 13 15 16

DRUM AND BASS 3
BD 1 11
SN 5 13
CH ALL
OH 7 8 9 10

DRUM AND BASS 4 - A
BD 1 7
SN 5 11 13
CH ODD
OH 1

DRUM AND BASS 4 - B
BD 5 11
SN 5 13
CH ODD

JUNGLE - A
BD 1 3 11
SN 5 8 10 15
CH ODD
OH 1

JUNGLE - B
BD 2 3 11
SN 2 5 8 10 15
CH ODD

## EDM
TECHNO
BD 1 5 9 13 15
SN 5 13
CH 10
OH 3 7 11 15

DUBSTEP - A
BD 1 11
SN 9
CH 2 3 7 12 15
OH 5 14

DUBSTEP - B
BD 1 4 7 11
SN 9
CH 2 3 7 12 15
OH 5 14

DUBSTEP - RATCHETED
BD 1 4 9 12
SN 5 13 16
CH 1 2 6 7 8 9 10 12 13 14 16
OH 7

UK GARAGE - A
BD 1 11
CL 5 13
CH 3 4 7 11 15 16
RS 2 8 14
MT 6 12

UK GARAGE - B
BD 1 11
CL 5 13
CH 3 7 11 15
RS 8 14
MT 6 12

SYNTH WAVE
BD 1 9
SN 5 13
CH ALL
OH 14

## Dub
HALF DROP
BD 1
SN 9
CH ODD

ONE DROP
BD 9
SN 9
CH ODD

TWO DROP
BD 1 9
SN 9
CH ODD

STEPPERS
BD 1 5 9 13
SN 9
CH ODD

## Reggaeton
REGGAETON 1
BD 1 5 9 13
SN 4 7 12 15
CH ODD

REGGAETON 2
CH 3 7 11 15
SN 4 6 7 8 11 12 15
BD 1 8

REGGAETON 3 - A
SN 1 4 7 9 12 15
BD 1 9

REGGAETON 3 - B
CH 1 4 7 9 12 15
SN 1 4 7 9 12 15
BD 1 9

## Pop
POP 1 - A
CH ALL
OH 1 4 7 9 10
RS 1 2 4 7 8 11 12
SN 5 13
BD 1 2 4 8 11
HC 5 13

IN THE AIR LAST NIGHT - A
HT 3 7
OH 1 13
CH 3 7 11 13
SN 13
BD 11

IN THE AIR LAST NIGHT - B
HT 3 7
OH 1 13
CH 3 7 11 13
SN 13
BD 1 3 5 7 9 11 15

NINETEEN - A
CH 1 4 7 9 10
OH 1 4 7 9 10
RS 1 2 4 7 8 11 12
BD 1 2 4 8 11
HC 5 13

NINETEEN - B
CH ALL
OH 1 4 7 9 10
RS 1 2 4 7 8 11 12
SN 5 13
BD 1 2 4 8 11
HC 5 13

BLEU MONDAY - A
OH 3 7 11 15
SN 5 13
BD 1 9
HC 5 13

BLEU MONDAY - B
CH 1 4 5 8 9 12 13 16
OH 3 7 11 15
SN 5 13
BD 1 9
HC 5 13

## Breaks
STANDARD BREAKBEAT 1
BD 1 11
SN 5 13

STANDARD BREAKBEAT 2
BD 1 3 11
SN 5 13

STANDARD BREAKBEAT 3
BD 1 3 7 11
SN 5 8 10 13

POLYRHYTHMIC - A
BD 1 7
SN 3 5 9 11 12 13 15 16

POLYRHYTHMIC - B
BD 3 9
SN 5 7 11 13

## Hybrid Breaks
HYBRID KICK
BD 1 9
SN 5 13

HYBRID BREAK ENDING 1
BD 1 11
SN 5 10 13

HYBRID BREAK ENDING 2
BD 1 7 9 12
SN 5 13

HYBRID BREAK ENDING 3
BD 1 8 11
SN 5 13

HYBRID BREAK ENDING 4
BD 1 10
SN 5 13

HYBRID BREAK ENDING 5
BD 1 3 9 11
SN 5 13

HYBRID BREAK ENDING 6
BD 1 6 8 10 11
SN 5 13

HYBRID 7 - A
BD 1 3 9 11
SN 5 13

HYBRID 7 - B
BD 1 2 9 11
SN 5 13

HYBRID 8 - A
BD 1 9 11
SN 5 13

HYBRID 8 - B
BD 1 2 9 11
SN 5 13

## Irregular Breaks
IRREGULAR 1 - A
BD 1 3 4 7 11
SN 5 8 13 16

IRREGULAR 1 - B
BD 1 3 8 11
SN 5 13 16

IRREGULAR 2 - A
BD 1 8 11
SN 4 13

IRREGULAR 2 - B
BD 1 3 7 11
SN 5 9 13

IRREGULAR 3
BD 1 4 9 15
SN 2 5 11 14

## Rolling Breaks
ROLLING 1
BD 1 11
SN 5 13

ROLLING 2
BD 1 11 14
SN 5 13

ROLLING 3 - A
BD 1 7 13
SN 5 11

ROLLING 3 - B
BD 1 7 13
SN 5 11 15

ROLLING 4 - A
BD 1 2
SN 5 13

ROLLING 4 - B
BD 1 8 10 11
SN 5 13

ROLLING 5 - A
BD 1 3 11
SN 5 13

ROLLING 5 - B
BD 1 4 11
SN 5 13

ROLLING 6 - A
BD 1 7 12
SN 5 13

ROLLING 6 - B
BD 1 3 8 11 14
SN 5 13

ROLLING 7 - A
BD 1 8 9 12
SN 5 13

ROLLING 7 - B
BD 1 4 8 11
SN 5 13

ROLLING 7 - C
BD 1 8 11
SN 5 13

ROLLING 7 - D
BD 1 4 8 11
SN 5 13

ROLLING 8
BD 1 8
SN 5 13

ROLLING 9 - A
BD 1 9 11
SN 5 13

ROLLING 9 - B
BD 1 2 9 11
SN 5 13

ROLLING 10
BD 1 8 12
SN 5 13

ROLLING 11
BD 1 6 7 10 11
SN 5 13

## Breaks - Snare
CONTEMPORARY SNARE 1 - A
BD 1 11
SN 5 10 15

CONTEMPORARY SNARE 1 - B
BD 3 11
SN 7 10 13

CONTEMPORARY SNARE 2 - A
BD 1 3 11
SN 5 13

CONTEMPORARY SNARE 2 - B
BD 3 11 12
SN 5 10 13

CONTEMPORARY SNARE 3 - A
BD 1 7 15
SN 5 11 14 16

CONTEMPORARY SNARE 3 - B
BD 1 4 7 15
SN 5 11

UNCONVENTIONAL SNARE 1 - A
BD 1 5 11
SN 9 15

UNCONVENTIONAL SNARE 1 - B
BD 1 7 11
SN 5 13

UNCONVENTIONAL SNARE 2 - A
BD 1 13
SN 5 9 12

UNCONVENTIONAL SNARE 2 - B
BD 1 5 9 11
SN 8 13

UNCONVENTIONAL SNARE 3 - A
BD 1 7 14
SN 5 11

UNCONVENTIONAL SNARE 3 - B
BD 1 5 9 11
SN 8 13

UNCONVENTIONAL SNARE 4 - A
BD 1 3 7 9
SN 5 11

UNCONVENTIONAL SNARE 4 - B
BD 3 11
SN 1 5 10 13

## Ghost Snares
GHOST SNARE 1 - A
SN 5 8 10 13 16

GHOST SNARE 1 - B
SN 5 8 10 13

GHOST SNARE 2 - A
SN 2 5 8 13 16

GHOST SNARE 2 - B
SN 2 5 10 13 16

## Breaks - Kick
CONTEMPORARY KICK 1 - A
BD 1 11
SN 5 15

CONTEMPORARY KICK 1 - B
BD 3 8 11
SN 5 13

CONTEMPORARY KICK 2 - A
BD 3 8 11
SN 5 10 13

CONTEMPORARY KICK 2 - B
BD 3 11 14
SN 5 13

CONTEMPORARY KICK 3 - A
BD 1 11
SN 5 15

CONTEMPORARY KICK 3 - B
BD 1 9 11
SN 5 13

CONTEMPORARY KICK 4
BD 1 9
SN 5 11

## Drum Rolls
DRUM ROLL 1
HT 9 10 11
MT 12 13 14
LT 15 16
OH 1
CY 1

DRUM ROLL 2
BD 13 15
SN 1 3 4 5 7 9 10 11 12

DRUM ROLL 3
SN 1 2 3 5 6 7 9 11 13 14 15 16

DRUM ROLL 4
BD 1 7 13
SN 4 5 8 9 16
CY 1 7 13

DRUM ROLL 5
HT 1
MT 5 9 11
LT 13 15

DRUM ROLL 7
HT 3
MT 4 7 8
LT 11 12 14
SN 1 5 9 13

DRUM ROLL 8
HT 3
MT 5 9 11 12
LT 15 16
SN 1 8 13

DRUM ROLL 9
HT 3
MT 5 11
LT 13 15
SN 1 2 7 9 10

DRUM ROLL 10
HT 3 4
MT 7 8 11 12
LT 15 16
SN 1 2 5 6 9 10 13 14

DRUM ROLL 11
HT 2 14
MT 5 8
LT 11 15 16
SN 1 4 7 10 13
BD 3 6 9 12

DRUM ROLL 12
HT 3 10
MT 11 13
LT 12 14 15
SN 1 2 9 13
BD 5 7
CY 5 7

DRUM ROLL 13
HT 2
MT 6 10
LT 14
SN 1 5 9 13
BD 3 4 7 8 11 12 15 16

DRUM ROLL 14
HT 10 11 12 13
MT 4 5 6 7 8 9 14 15
LT 1 2 3 16

DRUM ROLL 15
HT 2 10
LT 4 8 12 16
SN 1 5 9 13

DRUM ROLL 16
SN 1 2 7 8 13 14
BD 3 5 11 15
CH 3 9 15
CY 5 11

DRUM ROLL 17
HT 3 4
MT 9 10
SN 1 2 5 7 8 11 13 14 15 16
CY 5 11

DRUM ROLL 18
SN 1 7
BD 3 5 9 11 15
CY 1 7 13

DRUM ROLL 19
SN 1 2 7 8 13 14
BD 3 5 9 11 15
CY 3 5 9 11 15

DRUM ROLL 20
HT 3 5
MT 7 15
LT 16
SN 1 9 11 14
BD 2 4 6 8 10 12 13
CY 9
"""

CITIES = {
    # id: (name, country, lat, lon, timezone)
    "chicago": ("Chicago", "US", 41.8781, -87.6298, "America/Chicago"),
    "detroit": ("Detroit", "US", 42.3314, -83.0458, "America/Detroit"),
    "new-york": ("New York", "US", 40.7128, -74.0060, "America/New_York"),
    "miami": ("Miami", "US", 25.7617, -80.1918, "America/New_York"),
    "atlanta": ("Atlanta", "US", 33.7490, -84.3880, "America/New_York"),
    "augusta": ("Augusta", "US", 33.4735, -82.0105, "America/New_York"),
    "washington-dc": ("Washington DC", "US", 38.9072, -77.0369, "America/New_York"),
    "dayton": ("Dayton", "US", 39.7589, -84.1916, "America/New_York"),
    "memphis": ("Memphis", "US", 35.1495, -90.0490, "America/Chicago"),
    "new-orleans": ("New Orleans", "US", 29.9511, -90.0715, "America/Chicago"),
    "los-angeles": ("Los Angeles", "US", 34.0522, -118.2437, "America/Los_Angeles"),
    "london": ("London", "GB", 51.5074, -0.1278, "Europe/London"),
    "manchester": ("Manchester", "GB", 53.4808, -2.2426, "Europe/London"),
    "headley": ("Headley, Hampshire", "GB", 51.1186, -0.8264, "Europe/London"),
    "paris": ("Paris", "FR", 48.8566, 2.3522, "Europe/Paris"),
    "kingston": ("Kingston", "JM", 17.9714, -76.7931, "America/Jamaica"),
    "san-juan": ("San Juan", "PR", 18.4655, -66.1057, "America/Puerto_Rico"),
    "havana": ("Havana", "CU", 23.1136, -82.3666, "America/Havana"),
    "rio": ("Rio de Janeiro", "BR", -22.9068, -43.1729, "America/Sao_Paulo"),
    "lagos": ("Lagos", "NG", 6.5244, 3.3792, "Africa/Lagos"),
    "accra": ("Accra", "GH", 5.6037, -0.1870, "Africa/Accra"),
    "kinshasa": ("Kinshasa", "CD", -4.4419, 15.2663, "Africa/Kinshasa"),
    # Euclidean-only cities
    "barranquilla": ("Barranquilla", "CO", 10.9685, -74.7813, "America/Bogota"),
    "tehran": ("Tehran", "IR", 35.6892, 51.3890, "Asia/Tehran"),
    "sofia": ("Sofia", "BG", 42.6977, 23.3219, "Europe/Sofia"),
    "istanbul": ("Istanbul", "TR", 41.0082, 28.9784, "Europe/Istanbul"),
    "cairo": ("Cairo", "EG", 30.0444, 31.2357, "Africa/Cairo"),
    "kumasi": ("Kumasi", "GH", 6.6885, -1.6244, "Africa/Accra"),
    "johannesburg": ("Johannesburg", "ZA", -26.2041, 28.0473, "Africa/Johannesburg"),
    "bangui": ("Bangui", "CF", 4.3947, 18.5582, "Africa/Bangui"),
}

# section -> (city, genre, bpm, confidence, role)
SECTION_DEFAULTS = {
    "Basic Patterns": (None, "basic", 100, None, "starter"),
    "Standard Breaks": (None, "breakbeat", 100, None, "break"),
    "Rock": (None, "rock", 120, None, "groove"),
    "Electro": ("detroit", "electro", 125, "medium", "groove"),
    "House": ("chicago", "house", 124, "high", "groove"),
    "Miami Bass": ("miami", "miami bass", 130, "high", "groove"),
    "Hip Hop": ("new-york", "hip-hop", 90, "medium", "groove"),
    "Funk and Soul": (None, "funk", 100, None, "groove"),
    "Afro-Cuban": (None, "afro-cuban", 110, None, "groove"),
    "Drum and Bass": ("london", "drum and bass", 174, "high", "groove"),
    "EDM": (None, "electronic", 128, None, "groove"),
    "Dub": ("kingston", "reggae", 75, "high", "groove"),
    "Reggaeton": ("san-juan", "reggaeton", 92, "medium", "groove"),
    "Pop": (None, "pop", 110, None, "groove"),
    "Breaks": (None, "breakbeat", 130, None, "variation"),
    "Hybrid Breaks": (None, "breakbeat", 130, None, "variation"),
    "Irregular Breaks": (None, "breakbeat", 130, None, "variation"),
    "Rolling Breaks": (None, "breakbeat", 130, None, "variation"),
    "Breaks - Snare": (None, "breakbeat", 130, None, "variation"),
    "Ghost Snares": (None, "breakbeat", 130, None, "layer"),
    "Breaks - Kick": (None, "breakbeat", 130, None, "variation"),
    "Drum Rolls": (None, "fill", 120, None, "fill"),
}

# base name -> dict of overrides
O = {
    "SIBERIAN NIGHTS": dict(city=None, confidence=None),
    "NEW WAVE": dict(city=None, genre="new wave", bpm=120, confidence=None),
    "BRIT HOUSE": dict(city="london"),
    "FRENCH HOUSE": dict(city="paris", bpm=122),
    "DIRTY HOUSE": dict(bpm=126, confidence="medium"),
    "DEEP HOUSE": dict(bpm=120, genre="deep house"),
    "DEEPER HOUSE": dict(bpm=120, genre="deep house"),
    "SLOW DEEP HOUSE": dict(bpm=112, genre="deep house"),
    "FOOTWORK": dict(bpm=160, genre="footwork"),
    "TRAP": dict(city="atlanta", genre="trap", bpm=140, confidence="high"),
    "PLANET ROCK": dict(genre="electro-funk", bpm=127, confidence="high", note="Afrika Bambaataa, the Bronx"),
    "INNA CLUB": dict(confidence="low"),
    "ICE": dict(city=None, confidence=None),
    "BACK TO CALI": dict(city="los-angeles", genre="g-funk", bpm=95, confidence="high"),
    "SNOOP STYLES": dict(city="los-angeles", genre="g-funk", bpm=92, confidence="high", note="Long Beach"),
    "THE GROOVE": dict(city=None, confidence=None),
    "BOOM BAP": dict(bpm=92, confidence="high"),
    "MOST WANTED": dict(city="los-angeles", bpm=95, confidence="medium"),
    # Funk and Soul
    "AMEN BREAK": dict(city="washington-dc", bpm=136, confidence="high", note="The Winstons; later the backbone of London jungle"),
    "THE FUNKY DRUMMER": dict(city="augusta", confidence="high", note="James Brown's hometown; recorded in Cincinnati"),
    "IMPEACH THE PRESIDENT": dict(city="new-york", bpm=96, confidence="high", note="The Honey Drippers"),
    "WHEN THE LEVEE BREAKS": dict(city="headley", genre="rock", bpm=72, confidence="high", note="Led Zeppelin, recorded at Headley Grange"),
    "IT'S A NEW DAY": dict(city="new-york", bpm=98, confidence="medium", note="Skull Snaps"),
    "THE BIG BEAT": dict(genre="rock"),
    "ASHLEY'S ROACHCLIP": dict(city="washington-dc", confidence="high", note="The Soul Searchers, DC go-go"),
    "SUPERSTITION": dict(city="detroit", confidence="medium", note="Stevie Wonder, Motown"),
    "CISSY STRUT": dict(city="new-orleans", bpm=92, confidence="high", note="The Meters"),
    "HOOK AND SLING": dict(city="new-orleans", bpm=98, confidence="high", note="Eddie Bo"),
    "KISSING MY LOVE": dict(city="los-angeles", bpm=96, confidence="medium", genre="soul", note="Bill Withers"),
    "KNOCKS ME OFF MY FEET": dict(city="detroit", bpm=88, confidence="medium", genre="soul", note="Stevie Wonder"),
    "THE THRILL IS GONE": dict(city="memphis", bpm=90, confidence="medium", genre="blues", note="B.B. King"),
    "COLD SWEAT": dict(city="augusta", bpm=112, confidence="high", note="James Brown"),
    "I GOT YOU (I FEEL GOOD)": dict(city="augusta", bpm=144, confidence="high", note="James Brown"),
    "FUNKY PRESIDENT": dict(city="augusta", bpm=102, confidence="high", note="James Brown"),
    "GET UP": dict(city="augusta", bpm=108, confidence="high", note="James Brown"),
    "MOTHER POPCORN": dict(city="augusta", bpm=108, confidence="high", note="James Brown"),
    "I GOT THE FEELIN'": dict(city="augusta", bpm=120, confidence="high", note="James Brown"),
    "GROOVE ME": dict(city="new-orleans", confidence="medium", genre="soul", note="King Floyd"),
    "LOOK-KA PY PY": dict(city="new-orleans", bpm=96, confidence="high", note="The Meters"),
    "USE ME": dict(city="los-angeles", bpm=76, confidence="medium", genre="soul", note="Bill Withers"),
    "EXPENSIVE SHIT": dict(city="lagos", bpm=108, confidence="high", genre="afrobeat", note="Fela Kuti"),
    "THE FEZ": dict(city="los-angeles", bpm=120, confidence="medium", note="Steely Dan"),
    "ROCK STEADY": dict(city="detroit", bpm=104, confidence="medium", genre="soul", note="Aretha Franklin"),
    "SYNTHETIC SUBSTITUTION": dict(city="new-york", confidence="medium", note="Melvin Bliss"),
    "O-O-H CHILD": dict(city="chicago", bpm=104, confidence="high", genre="soul", note="Five Stairsteps"),
    "LADY MARMALADE": dict(city="new-orleans", bpm=116, confidence="high", note="Set in New Orleans; produced by Allen Toussaint"),
    "COME DANCING": dict(city="london", bpm=104, confidence="high", genre="pop", note="The Kinks"),
    "RESPECT YOURSELF": dict(city="memphis", confidence="high", genre="soul", note="The Staple Singers, Stax"),
    "EXPRESS YOURSELF": dict(city="los-angeles", bpm=96, confidence="high", note="Charles Wright, Watts"),
    "LET A WOMAN BE A WOMAN": dict(city="los-angeles", confidence="medium", note="Dyke & the Blazers"),
    "LET A MAN BE A MAN": dict(city="los-angeles", confidence="medium", note="Dyke & the Blazers"),
    "MORE BOUNCE TO THE OUNCE": dict(city="dayton", bpm=105, confidence="high", note="Zapp"),
    # Afro-Cuban
    "SON CLAVE": dict(city="havana", bpm=100, confidence="high", genre="son"),
    "RUMBA": dict(city="havana", bpm=110, confidence="high", genre="rumba"),
    "BOSSA NOVA": dict(city="rio", bpm=120, confidence="high", genre="bossa nova"),
    "GAHU": dict(city="accra", bpm=120, confidence="medium", genre="ewe drumming", note="Ewe, Volta region"),
    "SHIKO": dict(city="lagos", bpm=120, confidence="medium", genre="shiko"),
    "SOUKOUS": dict(city="kinshasa", bpm=130, confidence="high", genre="soukous"),
    # DnB / EDM
    "JUNGLE": dict(bpm=165, genre="jungle"),
    "TECHNO": dict(city="detroit", genre="techno", bpm=130, confidence="high"),
    "DUBSTEP": dict(city="london", genre="dubstep", bpm=140, confidence="high", note="Croydon, South London"),
    "UK GARAGE": dict(city="london", genre="uk garage", bpm=132, confidence="high"),
    "SYNTH WAVE": dict(genre="synthwave", bpm=100),
    "STEPPERS": dict(bpm=80),
    # Pop
    "IN THE AIR LAST NIGHT": dict(city="london", bpm=96, confidence="medium", note="Phil Collins"),
    "NINETEEN": dict(city="london", bpm=120, confidence="high", genre="electro-pop", note="Paul Hardcastle"),
    "BLEU MONDAY": dict(city="manchester", bpm=130, confidence="high", genre="synth-pop", note="New Order"),
}

VOICE_ALIAS = {"HC": "CL"}  # book uses HC and CL for hand clap


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def steps_from(nums):
    arr = [0] * 16
    for n in nums:
        assert 1 <= n <= 16, n
        arr[n - 1] = 1
    return arr


def parse():
    patterns, section, cur = [], None, None
    for line in BOOK.strip().splitlines():
        line = line.strip()
        if not line:
            cur = None
            continue
        if line.startswith("## "):
            section = line[3:]
            continue
        m = re.match(r"^([A-Z]{2})(?:\s+(.*))?$", line)
        if m and cur is not None:
            v, rest = m.group(1), (m.group(2) or "")
            rest = rest.replace("ODD", ODD).replace("ALL", ALL)
            nums = [int(x) for x in rest.split()]
            v = VOICE_ALIAS.get(v, v)
            cur["voices"][v] = steps_from(nums)
            continue
        name = line
        pm = re.match(r"^(.*?) - ([A-Z]|RATCHETED)$", name)
        base, part = (pm.group(1), pm.group(2)) if pm else (name, None)
        cur = {"book_name": name, "base": base, "part": part, "section": section, "voices": {}}
        patterns.append(cur)
    return patterns


def bjorklund(k, n):
    if k == 0:
        return [0] * n
    groups = [[1] for _ in range(k)] + [[0] for _ in range(n - k)]
    while True:
        rem = len(groups) - k
        if rem <= 1:
            break
        m = min(k, rem)
        new = [groups[i] + groups[k + i] for i in range(m)]
        leftover = groups[m:k] if m < k else groups[k + m:]
        groups = new + leftover
        k = m
    return [x for g in groups for x in g]


def rotate(a, r):
    r %= len(a)
    return a[r:] + a[:r]


EUCLID = [
    # city, name, tradition, (k, n, rotation), bpm, confidence
    ("havana", "Tresillo", "Cuban tresillo, the root of the habanera", (3, 8, 0), 100, "high"),
    ("havana", "Cinquillo", "Cuban cinquillo", (5, 8, 0), 100, "high"),
    ("barranquilla", "Cumbia", "Colombian cumbia", (3, 4, 2), 95, "medium"),
    ("rio", "Samba", "Brazilian samba necklace", (7, 16, 0), 100, "medium"),
    ("tehran", "Khafif-e-ramal", "Persian rhythm in 5", (2, 5, 0), 110, "medium"),
    ("sofia", "Ruchenitza", "Bulgarian dance rhythm in 7", (4, 7, 0), 120, "medium"),
    ("istanbul", "Aksak", "Turkish aksak in 9 (2+2+2+3)", (4, 9, 0), 120, "high"),
    ("cairo", "Nawakhat", "Arabic rhythm in 7", (5, 7, 0), 100, "low"),
    ("kumasi", "Ashanti bell", "West African standard bell pattern in 12", (7, 12, 0), 115, "high"),
    ("johannesburg", "Venda clapping", "Venda clapping pattern, Limpopo", (5, 12, 0), 110, "medium"),
    ("bangui", "Aka", "Aka (BaAka) polyrhythm in 24", (13, 24, 0), 100, "low"),
]


def build():
    raw = parse()
    counters, patterns = {}, []
    for p in raw:
        city, genre, bpm, conf, role = SECTION_DEFAULTS[p["section"]]
        rec = dict(city=city, genre=genre, bpm=bpm, confidence=conf, role=role, note=None)
        rec.update(O.get(p["base"], {}))
        key = (rec["city"], rec["genre"]) if rec["city"] else (None, p["section"])
        group_key = key + (p["base"],)
        if group_key not in counters:
            counters[group_key] = sum(1 for k in counters if k[:2] == key) + 1
        n = counters[group_key]
        if rec["city"]:
            public = f"{CITIES[rec['city']][0]} {rec["genre"].title().replace("Uk ","UK ").replace(" And "," and ")} {n}"
        else:
            public = f"{p['section']} {n}"
        if p["part"]:
            public += f" {p['part'].title()}"
        patterns.append({
            "id": slug(f"{p['section']} {p['book_name']}"),
            "public_name": public,
            "book_name": p["book_name"],
            "section": p["section"],
            "chain_group": slug(f"{p['section']} {p['base']}") if p["part"] else None,
            "chain_part": p["part"],
            "city": rec["city"],
            "genre": rec["genre"],
            "role": rec["role"],
            "bpm": rec["bpm"],
            "confidence": rec["confidence"],
            "note": rec["note"],
            "steps": 16,
            "voices": p["voices"],
        })

    euclid = []
    for city, name, trad, (k, n, rot), bpm, conf in EUCLID:
        euclid.append({
            "id": slug(f"euclid {city} {name}"),
            "public_name": f"{CITIES[city][0]} {name}",
            "city": city,
            "tradition": trad,
            "steps": n,
            "bpm": bpm,
            "confidence": conf,
            "voices": {
                "BD": rotate(bjorklund(1, n), 0),
                "RS": rotate(bjorklund(k, n), rot),
                "SH": [1] * n,
            },
            "euclid": {"voice": "RS", "pulses": k, "steps": n, "rotation": rot},
        })

    used = {p["city"] for p in patterns if p["city"]} | {e["city"] for e in euclid}
    cities = []
    for cid, (name, cc, lat, lon, tz) in CITIES.items():
        if cid not in used:
            continue
        book = [p for p in patterns if p["city"] == cid]
        cities.append({
            "id": cid, "name": name, "country": cc, "lat": lat, "lon": lon, "timezone": tz,
            "genres": sorted({p["genre"] for p in book}),
            "pattern_ids": [p["id"] for p in book],
            "euclidean_ids": [e["id"] for e in euclid if e["city"] == cid],
        })

    data = {
        "meta": {
            "title": "Rhythm Atlas data",
            "version": "0.1",
            "sources": [
                "Paul Wenzel, Pocket Operations, 2nd ed. rev 3.1 (2024). Check the book's licence and credit it before public release.",
                "Godfried Toussaint, 'The Euclidean Algorithm Generates Traditional Musical Rhythms' (2005), for the Euclidean entries.",
            ],
            "grid": "Book patterns are 16 steps. Euclidean patterns use their own step count, so they run in polymeter against the 16-step grid.",
            "voices": {"BD": "bass drum", "SN": "snare", "CL": "hand clap (book's HC merged here)", "CH": "closed hat",
                        "OH": "open hat", "CY": "cymbal / ride (in funk sections it is often the hat line)",
                        "RS": "rimshot", "CB": "cowbell", "SH": "shaker", "LT": "low tom", "MT": "mid tom", "HT": "high tom"},
            "notes": [
                "Accent rows (AC) are omitted: their positions did not survive in the source text.",
                "city is null for patterns with no clear place. Use them as variations, fills and layers.",
                "confidence says how sure the city link is: high, medium or low. Some origins are debated.",
                "public_name avoids song titles; book_name keeps the original for credit and reference.",
                "bpm is a suggested starting tempo for the style, not taken from the book.",
            ],
        },
        "cities": cities,
        "patterns": patterns,
        "euclidean": euclid,
    }
    return data


if __name__ == "__main__":
    d = build()
    with open("rhythm-atlas.json", "w") as f:
        json.dump(d, f, indent=1)
    placed = [p for p in d["patterns"] if p["city"]]
    print(len(d["patterns"]), "book patterns,", len(placed), "placed;", len(d["euclidean"]), "euclidean;", len(d["cities"]), "cities")
    for c in d["cities"]:
        print(f"  {c['name']:22} {len(c['pattern_ids']):3} book  {len(c['euclidean_ids'])} euclid  {', '.join(c['genres'])}")
    for e in d["euclidean"]:
        print("  ", e["public_name"], "".join("x" if s else "." for s in e["voices"]["RS"]))
