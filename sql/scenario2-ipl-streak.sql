-- 30 or more runs in three or more of that player's innings, by match date.
-- A missing row is skipped. Under 30 ends the streak. Four in a row is one row.

WITH ordered AS (
  SELECT
    b.player_name,
    m.match_date,
    b.runs,
    ROW_NUMBER() OVER (PARTITION BY b.player_name ORDER BY m.match_date, m.match_id) AS rn
  FROM batting AS b
  JOIN matches AS m ON m.match_id = b.match_id
),
hot AS (
  SELECT
    player_name,
    match_date,
    rn - ROW_NUMBER() OVER (PARTITION BY player_name ORDER BY match_date, rn) AS island
  FROM ordered
  WHERE runs >= 30
)
SELECT
  player_name,
  MIN(match_date) AS streak_commenced,
  COUNT(*) AS matches_in_streak
FROM hot
GROUP BY player_name, island
HAVING COUNT(*) >= 3
ORDER BY streak_commenced, player_name;
