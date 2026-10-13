-- One row per question and city. No people, no times, no addresses: just two counts.
CREATE TABLE IF NOT EXISTS tally (
  q      TEXT    NOT NULL,   -- question id, e.g. "food"
  city   TEXT    NOT NULL,   -- "lisbon|portugal"
  shown  INTEGER NOT NULL DEFAULT 0,   -- times it was one of the three on offer
  picked INTEGER NOT NULL DEFAULT 0,   -- times someone picked it
  PRIMARY KEY (q, city)
);
