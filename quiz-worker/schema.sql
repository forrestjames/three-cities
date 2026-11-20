CREATE TABLE IF NOT EXISTS tally (q TEXT NOT NULL, city TEXT NOT NULL, shown INTEGER NOT NULL DEFAULT 0, picked INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (q, city));

CREATE TABLE IF NOT EXISTS events (day TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind, key));

-- phone remote for the record test (the Worker also makes this by itself on first use)
CREATE TABLE IF NOT EXISTS remote (code TEXT PRIMARY KEY, cmds TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT '{}', seen INTEGER NOT NULL DEFAULT 0);
