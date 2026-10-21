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
   600,
   360
  ],
  "openinpresentation": 1,
  "devicewidth": 412.0,
  "boxes": [
   {
    "box": {
     "id": "cmt",
     "maxclass": "comment",
     "patching_rect": [
      20,
      10,
      300,
      20
     ],
     "presentation": 1,
     "presentation_rect": [
      6,
      4,
      120,
      18
     ],
     "text": "City Track v2",
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "city",
     "maxclass": "live.menu",
     "patching_rect": [
      20,
      40,
      90,
      15
     ],
     "presentation": 1,
     "presentation_rect": [
      6,
      26,
      100,
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
     "varname": "City",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "City",
       "parameter_shortname": "City",
       "parameter_enum": [
        "City 1",
        "City 2",
        "City 3"
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
     "id": "src",
     "maxclass": "live.menu",
     "patching_rect": [
      130,
      40,
      90,
      15
     ],
     "presentation": 1,
     "presentation_rect": [
      6,
      48,
      100,
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
     "varname": "Hits from",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Hits from",
       "parameter_shortname": "Hits from",
       "parameter_enum": [
        "humidity",
        "wind",
        "cloud",
        "rain"
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
     "id": "note",
     "maxclass": "live.dial",
     "patching_rect": [
      240,
      30,
      44,
      48
     ],
     "presentation": 1,
     "presentation_rect": [
      120,
      22,
      44,
      48
     ],
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "",
      "float"
     ],
     "parameter_enable": 1,
     "varname": "Note",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Note",
       "parameter_shortname": "Note",
       "parameter_mmin": 0.0,
       "parameter_mmax": 127.0,
       "parameter_initial": [
        60
       ],
       "parameter_initial_enable": 1,
       "parameter_type": 1,
       "parameter_unitstyle": 8
      }
     }
    }
   },
   {
    "box": {
     "id": "dens",
     "maxclass": "live.dial",
     "patching_rect": [
      300,
      30,
      44,
      48
     ],
     "presentation": 1,
     "presentation_rect": [
      170,
      22,
      44,
      48
     ],
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "",
      "float"
     ],
     "parameter_enable": 1,
     "varname": "Density",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Density",
       "parameter_shortname": "Density",
       "parameter_mmin": 0.0,
       "parameter_mmax": 100.0,
       "parameter_initial": [
        50
       ],
       "parameter_initial_enable": 1,
       "parameter_type": 0,
       "parameter_unitstyle": 5
      }
     }
    }
   },
   {
    "box": {
     "id": "chance",
     "maxclass": "live.dial",
     "patching_rect": [
      400,
      30,
      44,
      48
     ],
     "presentation": 1,
     "presentation_rect": [
      220,
      22,
      44,
      48
     ],
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "",
      "float"
     ],
     "parameter_enable": 1,
     "varname": "Chance",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Chance",
       "parameter_shortname": "Chance",
       "parameter_mmin": 0.0,
       "parameter_mmax": 100.0,
       "parameter_initial": [
        100
       ],
       "parameter_initial_enable": 1,
       "parameter_type": 0,
       "parameter_unitstyle": 5
      }
     }
    }
   },
   {
    "box": {
     "id": "ratelbl",
     "maxclass": "comment",
     "patching_rect": [
      460,
      20,
      40,
      18
     ],
     "presentation": 1,
     "presentation_rect": [
      272,
      24,
      40,
      18
     ],
     "text": "Rate",
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "rate",
     "maxclass": "live.menu",
     "patching_rect": [
      460,
      40,
      60,
      15
     ],
     "presentation": 1,
     "presentation_rect": [
      272,
      44,
      60,
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
     "varname": "Rate",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Rate",
       "parameter_shortname": "Rate",
       "parameter_enum": [
        "Auto",
        "1/32",
        "1/16",
        "1/8",
        "1/4",
        "1/2",
        "1 bar"
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
     "id": "refresh",
     "maxclass": "message",
     "patching_rect": [
      360,
      40,
      55,
      22
     ],
     "presentation": 1,
     "presentation_rect": [
      6,
      72,
      55,
      20
     ],
     "text": "refresh",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "restart",
     "maxclass": "message",
     "patching_rect": [
      420,
      40,
      55,
      22
     ],
     "presentation": 1,
     "presentation_rect": [
      66,
      72,
      55,
      20
     ],
     "text": "restart",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "pc",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      90,
      80,
      22
     ],
     "text": "prepend city",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "ps",
     "maxclass": "newobj",
     "patching_rect": [
      130,
      90,
      80,
      22
     ],
     "text": "prepend hitsource",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "pn",
     "maxclass": "newobj",
     "patching_rect": [
      240,
      90,
      80,
      22
     ],
     "text": "prepend note",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "pd",
     "maxclass": "newobj",
     "patching_rect": [
      330,
      90,
      80,
      22
     ],
     "text": "prepend density",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "pch",
     "maxclass": "newobj",
     "patching_rect": [
      420,
      90,
      80,
      22
     ],
     "text": "prepend chance",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "pr",
     "maxclass": "newobj",
     "patching_rect": [
      510,
      90,
      80,
      22
     ],
     "text": "prepend rate",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "node",
     "maxclass": "newobj",
     "patching_rect": [
      300,
      130,
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
     "id": "metro",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      130,
      250,
      22
     ],
     "text": "metro 16n @autostart 1 @autostarttime 0",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "tick",
     "maxclass": "message",
     "patching_rect": [
      20,
      160,
      35,
      22
     ],
     "text": "tick",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "v8",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      200,
      150,
      22
     ],
     "text": "v8 city_track.js",
     "numinlets": 1,
     "numoutlets": 4,
     "outlettype": [
      "",
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "mf",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      240,
      100,
      22
     ],
     "text": "midiformat",
     "numinlets": 7,
     "numoutlets": 1,
     "outlettype": [
      "int"
     ]
    }
   },
   {
    "box": {
     "id": "mo",
     "maxclass": "newobj",
     "patching_rect": [
      20,
      275,
      60,
      22
     ],
     "text": "midiout",
     "numinlets": 1,
     "numoutlets": 0,
     "outlettype": []
    }
   },
   {
    "box": {
     "id": "rt",
     "maxclass": "newobj",
     "patching_rect": [
      200,
      240,
      90,
      22
     ],
     "text": "route w d p",
     "numinlets": 1,
     "numoutlets": 4,
     "outlettype": [
      "",
      "",
      "",
      ""
     ]
    }
   },
   {
    "box": {
     "id": "set0",
     "maxclass": "newobj",
     "patching_rect": [
      200,
      270,
      75,
      22
     ],
     "text": "prepend set",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "disp0",
     "maxclass": "message",
     "patching_rect": [
      200,
      300,
      140,
      20
     ],
     "presentation": 1,
     "presentation_rect": [
      6,
      98,
      400,
      18
     ],
     "text": "waiting for weather",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ],
     "fontsize": 10.0
    }
   },
   {
    "box": {
     "id": "set1",
     "maxclass": "newobj",
     "patching_rect": [
      350,
      270,
      75,
      22
     ],
     "text": "prepend set",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "disp1",
     "maxclass": "message",
     "patching_rect": [
      350,
      300,
      140,
      20
     ],
     "presentation": 1,
     "presentation_rect": [
      6,
      117,
      400,
      18
     ],
     "text": "",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ],
     "fontsize": 10.0
    }
   },
   {
    "box": {
     "id": "set2",
     "maxclass": "newobj",
     "patching_rect": [
      500,
      270,
      75,
      22
     ],
     "text": "prepend set",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ]
    }
   },
   {
    "box": {
     "id": "disp2",
     "maxclass": "message",
     "patching_rect": [
      500,
      300,
      140,
      20
     ],
     "presentation": 1,
     "presentation_rect": [
      6,
      136,
      400,
      18
     ],
     "text": "",
     "numinlets": 2,
     "numoutlets": 1,
     "outlettype": [
      ""
     ],
     "fontsize": 10.0
    }
   },
   {
    "box": {
     "id": "modelbl",
     "maxclass": "comment",
     "patching_rect": [
      540,
      20,
      40,
      18
     ],
     "presentation": 1,
     "presentation_rect": [
      340,
      24,
      40,
      18
     ],
     "text": "Mode",
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "mode",
     "maxclass": "live.menu",
     "patching_rect": [
      540,
      40,
      64,
      15
     ],
     "presentation": 1,
     "presentation_rect": [
      340,
      44,
      64,
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
     "varname": "Mode",
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Mode",
       "parameter_shortname": "Mode",
       "parameter_enum": [
        "Rhythm",
        "Melody"
       ],
       "parameter_type": 2,
       "parameter_initial": [
        1
       ],
       "parameter_initial_enable": 1
      }
     }
    }
   },
   {
    "box": {
     "id": "pm",
     "maxclass": "newobj",
     "patching_rect": [
      540,
      90,
      80,
      22
     ],
     "text": "prepend mode",
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
      "city",
      0
     ],
     "destination": [
      "pc",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pc",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "src",
      0
     ],
     "destination": [
      "ps",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "ps",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "note",
      0
     ],
     "destination": [
      "pn",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pn",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "dens",
      0
     ],
     "destination": [
      "pd",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pd",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "chance",
      0
     ],
     "destination": [
      "pch",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pch",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "rate",
      0
     ],
     "destination": [
      "pr",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pr",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "refresh",
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
      "node",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "metro",
      0
     ],
     "destination": [
      "tick",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tick",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "restart",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "v8",
      0
     ],
     "destination": [
      "mf",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "v8",
      2
     ],
     "destination": [
      "mf",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "v8",
      3
     ],
     "destination": [
      "metro",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "mf",
      0
     ],
     "destination": [
      "mo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "v8",
      1
     ],
     "destination": [
      "rt",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "rt",
      0
     ],
     "destination": [
      "set0",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "set0",
      0
     ],
     "destination": [
      "disp0",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "rt",
      1
     ],
     "destination": [
      "set1",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "set1",
      0
     ],
     "destination": [
      "disp1",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "rt",
      2
     ],
     "destination": [
      "set2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "set2",
      0
     ],
     "destination": [
      "disp2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "mode",
      0
     ],
     "destination": [
      "pm",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "pm",
      0
     ],
     "destination": [
      "v8",
      0
     ]
    }
   }
  ]
 }
}