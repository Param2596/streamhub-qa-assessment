-- Round-trip transfers: Account A pays Account B, and B pays a similar amount back.
-- A self-transfer is rejected by the check constraint.

CREATE TABLE accounts (
  account_id INTEGER PRIMARY KEY,
  holder_name TEXT NOT NULL
);

CREATE TABLE transactions (
  txn_id INTEGER PRIMARY KEY,
  from_account INTEGER NOT NULL REFERENCES accounts(account_id),
  to_account INTEGER NOT NULL REFERENCES accounts(account_id),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  txn_time TEXT NOT NULL,
  CHECK (from_account <> to_account)
);

-- IPL-style 2024 batting. A player who did not bat in a match has no row.
-- Consecutive matches means that player's own innings, ordered by match date.

CREATE TABLE matches (
  match_id INTEGER PRIMARY KEY,
  match_date TEXT NOT NULL,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL
);

CREATE TABLE batting (
  match_id INTEGER NOT NULL REFERENCES matches(match_id),
  player_name TEXT NOT NULL,
  runs INTEGER NOT NULL CHECK (runs >= 0),
  PRIMARY KEY (match_id, player_name)
);
