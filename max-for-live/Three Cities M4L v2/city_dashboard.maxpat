{
 "patcher": {
  "fileversion": 1,
  "appversion": {
   "major": 9,
   "minor": 0,
   "revision": 0,
   "architecture": "x64",
   "modernui": 1
  },
  "classnamespace": "box",
  "rect": [
   80,
   80,
   940,
   300
  ],
  "openinpresentation": 1,
  "devicewidth": 780.0,
  "boxes": [
   {
    "box": {
     "id": "pin",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      20,
      60,
      22
     ],
     "text": "plugin~",
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "pout",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      60,
      60,
      22
     ],
     "text": "plugout~",
     "numinlets": 2,
     "numoutlets": 0,
     "outlettype": []
    }
   },
   {
    "box": {
     "id": "node",
     "maxclass": "newobj",
     "patching_rect": [
      120,
      20,
      250,
      22
     ],
     "text": "node.script city_weather.js @autostart 1",
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "recv",
     "maxclass": "newobj",
     "patching_rect": [
      400,
      20,
      70,
      22
     ],
     "text": "r cityviz",
     "numinlets": 0,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "ui",
     "maxclass": "v8ui",
     "patching_rect": [
      120,
      80,
      780,
      169
     ],
     "presentation": 1,
     "presentation_rect": [
      0,
      0,
      640,
      169
     ],
     "filename": "city_dashboard.js",
     "numinlets": 1,
     "numoutlets": 0,
     "parameter_enable": 0,
     "border": 0
    }
   },
   {
    "box": {
     "id": "citylbl",
     "maxclass": "comment",
     "patching_rect": [
      20,
      240,
      140,
      18
     ],
     "presentation": 1,
     "presentation_rect": [
      646,
      4,
      132,
      18
     ],
     "text": "Cities (a, b, c \u21b5)",
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "cities",
     "maxclass": "textedit",
     "patching_rect": [
      20,
      260,
      200,
      40
     ],
     "presentation": 1,
     "presentation_rect": [
      646,
      22,
      130,
      38
     ],
     "numinlets": 1,
     "numoutlets": 4,
     "outlettype": [
      "",
      "int",
      "",
      "bang"
     ],
     "text": "Boston / Copenhagen / London",
     "fontsize": 10,
     "lines": 2,
     "bgcolor": [
      0.12,
      0.12,
      0.12,
      1
     ],
     "textcolor": [
      0.95,
      0.92,
      0.9,
      1
     ]
    }
   },
   {
    "box": {
     "id": "pcity",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      310,
      90,
      22
     ],
     "text": "prepend cities",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "keylbl",
     "maxclass": "comment",
     "patching_rect": [
      240,
      240,
      40,
      18
     ],
     "presentation": 1,
     "presentation_rect": [
      646,
      66,
      40,
      18
     ],
     "text": "Key",
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "key",
     "maxclass": "live.menu",
     "patching_rect": [
      240,
      260,
      50,
      15
     ],
     "presentation": 1,
     "presentation_rect": [
      690,
      68,
      86,
      15
     ],
     "numinlets": 1,
     "numoutlets": 3,
     "outlettype": [
      "",
      "",
      "float"
     ],
     "parameter_enable": 1,
     "varname": "Key",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Key",
       "parameter_shortname": "Key",
       "parameter_enum": [
        "C",
        "C#",
        "D",
        "Eb",
        "E",
        "F",
        "F#",
        "G",
        "Ab",
        "A",
        "Bb",
        "B"
       ],
       "parameter_type": 2,
       "parameter_initial": [
        0
       ],
       "parameter_initial_enable": 1
      }
     }
    }
   },
   {
    "box": {
     "id": "pkey",
     "maxclass": "newobj",
     "patching_rect": [
      240,
      310,
      80,
      22
     ],
     "text": "prepend key",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "scalelbl",
     "maxclass": "comment",
     "patching_rect": [
      330,
      240,
      50,
      18
     ],
     "presentation": 1,
     "presentation_rect": [
      646,
      90,
      40,
      18
     ],
     "text": "Scale",
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "scale",
     "maxclass": "live.menu",
     "patching_rect": [
      330,
      260,
      120,
      15
     ],
     "presentation": 1,
     "presentation_rect": [
      646,
      108,
      130,
      15
     ],
     "numinlets": 1,
     "numoutlets": 3,
     "outlettype": [
      "",
      "",
      "float"
     ],
     "parameter_enable": 1,
     "varname": "Scale",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Scale",
       "parameter_shortname": "Scale",
       "parameter_enum": [
        "minor pentatonic",
        "major pentatonic",
        "dorian",
        "natural minor",
        "major",
        "lydian",
        "phrygian",
        "whole tone",
        "mixolydian",
        "harmonic minor",
        "blues",
        "suspended pentatonic",
        "yo",
        "kumoi",
        "major hexatonic",
        "minor hexatonic",
        "ryukyu"
       ],
       "parameter_type": 2,
       "parameter_initial": [
        0
       ],
       "parameter_initial_enable": 1
      }
     }
    }
   },
   {
    "box": {
     "id": "pscale",
     "maxclass": "newobj",
     "patching_rect": [
      330,
      310,
      90,
      22
     ],
     "text": "prepend scale",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "changelbl",
     "maxclass": "comment",
     "patching_rect": [
      460,
      240,
      90,
      18
     ],
     "presentation": 1,
     "presentation_rect": [
      646,
      128,
      130,
      18
     ],
     "text": "Chords change",
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "change",
     "maxclass": "live.menu",
     "patching_rect": [
      460,
      260,
      120,
      15
     ],
     "presentation": 1,
     "presentation_rect": [
      646,
      146,
      130,
      15
     ],
     "numinlets": 1,
     "numoutlets": 3,
     "outlettype": [
      "",
      "",
      "float"
     ],
     "parameter_enable": 1,
     "varname": "Change",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Chords change",
       "parameter_shortname": "Change",
       "parameter_enum": [
        "4 bars",
        "8 bars",
        "16 bars",
        "32 bars",
        "Drone"
       ],
       "parameter_type": 2,
       "parameter_initial": [
        0
       ],
       "parameter_initial_enable": 1
      }
     }
    }
   },
   {
    "box": {
     "id": "pchange",
     "maxclass": "newobj",
     "patching_rect": [
      460,
      310,
      100,
      22
     ],
     "text": "prepend change",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   }
  ],
  "lines": [
   {
    "patchline": {
     "source": [
      "pin",
      0
     ],
     "destination": [
      "pout",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pin",
      1
     ],
     "destination": [
      "pout",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "node",
      0
     ],
     "destination": [
      "ui",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "recv",
      0
     ],
     "destination": [
      "ui",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "cities",
      0
     ],
     "destination": [
      "pcity",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pcity",
      0
     ],
     "destination": [
      "node",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "key",
      0
     ],
     "destination": [
      "pkey",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pkey",
      0
     ],
     "destination": [
      "node",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "scale",
      0
     ],
     "destination": [
      "pscale",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pscale",
      0
     ],
     "destination": [
      "node",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "change",
      0
     ],
     "destination": [
      "pchange",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pchange",
      0
     ],
     "destination": [
      "node",
      0
     ]
    }
   }
  ]
 }
}