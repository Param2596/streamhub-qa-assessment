INSERT INTO accounts (account_id, holder_name) VALUES
  (1, 'Alice'),
  (2, 'Bob'),
  (3, 'Carol');

-- Clusters are four days apart so a transfer cannot pair with another cluster's return.
-- Included: exact amount inside 1 hour.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (1, 1, 2, 10000.00, '2026-03-01 10:00:00'),
  (2, 2, 1, 10000.00, '2026-03-01 11:00:00');

-- Included: return is exactly 10% smaller, inside 24 hours.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (3, 1, 2, 10000.00, '2026-03-05 10:00:00'),
  (4, 2, 1, 9000.00, '2026-03-05 12:00:00');

-- Included: return is exactly 24 hours later and exactly 10% smaller.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (5, 1, 2, 10000.00, '2026-03-10 10:00:00'),
  (6, 2, 1, 9000.00, '2026-03-11 10:00:00');

-- Excluded: amounts differ by 11%.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (7, 1, 2, 10000.00, '2026-03-15 10:00:00'),
  (8, 2, 1, 8900.00, '2026-03-15 12:00:00');

-- Excluded: same amounts, 24 hours and 1 minute apart.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (9, 1, 2, 10000.00, '2026-03-20 10:00:00'),
  (10, 2, 1, 10000.00, '2026-03-21 10:01:00');

-- Excluded: Bob pays Carol, not Alice.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (11, 1, 2, 5000.00, '2026-03-25 09:00:00'),
  (12, 2, 3, 5000.00, '2026-03-25 10:00:00');

-- Included: a second Alice/Bob round trip on another day, 5% apart.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (13, 1, 2, 20000.00, '2026-04-01 08:00:00'),
  (14, 2, 1, 19000.00, '2026-04-01 18:00:00');

-- Included: Bob pays Alice first, then Alice pays Bob back within 10%.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (15, 2, 1, 4000.00, '2026-04-05 08:00:00'),
  (16, 1, 2, 4200.00, '2026-04-05 20:00:00');

-- Included: exactly 10% smaller with paise. Dividing 0.84 by 8.40 as decimals gives just over 0.10.
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES
  (17, 1, 2, 8.40, '2026-04-10 08:00:00'),
  (18, 2, 1, 7.56, '2026-04-10 14:00:00');

INSERT INTO matches (match_id, match_date, team1, team2) VALUES
  (1, '2024-03-23', 'DC', 'CSK'),
  (2, '2024-03-24', 'MI', 'RCB'),
  (3, '2024-03-25', 'RCB', 'CSK'),
  (4, '2024-03-26', 'GT', 'MI'),
  (5, '2024-03-27', 'DC', 'KKR'),
  (6, '2024-03-28', 'MI', 'LSG'),
  (7, '2024-03-29', 'GT', 'SRH'),
  (8, '2024-03-30', 'RCB', 'PBKS'),
  (9, '2024-03-31', 'MI', 'DC'),
  (10, '2024-04-01', 'MI', 'RR'),
  (11, '2024-04-02', 'GT', 'CSK'),
  (12, '2024-04-03', 'RCB', 'DC'),
  (13, '2024-04-04', 'GT', 'RR'),
  (14, '2024-04-05', 'MI', 'PBKS'),
  (15, '2024-04-06', 'GT', 'KKR'),
  (16, '2024-04-07', 'RCB', 'LSG'),
  (17, '2024-04-08', 'GT', 'RCB'),
  (18, '2024-04-09', 'DC', 'SRH'),
  (19, '2024-04-10', 'GT', 'MI'),
  (20, '2024-04-11', 'RCB', 'CSK'),
  (21, '2024-04-13', 'DC', 'RR'),
  (22, '2024-04-14', 'GT', 'PBKS'),
  (23, '2024-04-17', 'DC', 'LSG');

-- Rohit: exactly three scores of 30 or more, then a low score. Streak starts 2024-03-24.
INSERT INTO batting (match_id, player_name, runs) VALUES
  (2, 'Rohit Sharma', 45),
  (6, 'Rohit Sharma', 32),
  (10, 'Rohit Sharma', 30),
  (14, 'Rohit Sharma', 12);

-- Kohli: four in a row. One streak, commencing on the first of the four.
INSERT INTO batting (match_id, player_name, runs) VALUES
  (3, 'Virat Kohli', 55),
  (8, 'Virat Kohli', 41),
  (12, 'Virat Kohli', 67),
  (16, 'Virat Kohli', 38),
  (20, 'Virat Kohli', 8);

-- Gill: two hot innings, a score under 30, then three. Only the second run qualifies.
INSERT INTO batting (match_id, player_name, runs) VALUES
  (2, 'Shubman Gill', 40),
  (7, 'Shubman Gill', 35),
  (11, 'Shubman Gill', 18),
  (15, 'Shubman Gill', 52),
  (19, 'Shubman Gill', 33),
  (22, 'Shubman Gill', 31);

-- Hardik: 30, 30, 29, 40. The 29 breaks the run, so no streak of three.
INSERT INTO batting (match_id, player_name, runs) VALUES
  (4, 'Hardik Pandya', 30),
  (9, 'Hardik Pandya', 30),
  (13, 'Hardik Pandya', 29),
  (17, 'Hardik Pandya', 40);

-- Pant: two separate streaks of three.
INSERT INTO batting (match_id, player_name, runs) VALUES
  (1, 'Rishabh Pant', 44),
  (5, 'Rishabh Pant', 36),
  (10, 'Rishabh Pant', 51),
  (14, 'Rishabh Pant', 10),
  (18, 'Rishabh Pant', 60),
  (21, 'Rishabh Pant', 34),
  (23, 'Rishabh Pant', 39);

-- SKY misses the 2024-03-28 match. The missed match does not break his three hot innings.
INSERT INTO batting (match_id, player_name, runs) VALUES
  (2, 'Suryakumar Yadav', 42),
  (11, 'Suryakumar Yadav', 37),
  (17, 'Suryakumar Yadav', 55);

-- Rahul: only two scores of 30 or more, split by a low score.
INSERT INTO batting (match_id, player_name, runs) VALUES
  (2, 'KL Rahul', 50),
  (10, 'KL Rahul', 22),
  (17, 'KL Rahul', 40);
