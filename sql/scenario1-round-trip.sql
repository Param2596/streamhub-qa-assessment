-- Account A pays Account B, and B pays A back within 10% and within 24 hours.
-- Each unordered pair is returned once. account_a is whoever sent the earlier payment.

WITH pairs AS (
  SELECT
    t1.txn_id AS first_id,
    t2.txn_id AS second_id,
    CASE WHEN t1.txn_time <= t2.txn_time THEN t1.from_account ELSE t2.from_account END AS account_a_id,
    CASE WHEN t1.txn_time <= t2.txn_time THEN t1.to_account ELSE t2.to_account END AS account_b_id,
    CASE WHEN t1.txn_time <= t2.txn_time THEN t1.amount ELSE t2.amount END AS amount_out,
    CASE WHEN t1.txn_time <= t2.txn_time THEN t2.amount ELSE t1.amount END AS amount_back,
    CASE WHEN t1.txn_time <= t2.txn_time THEN t1.txn_time ELSE t2.txn_time END AS first_time,
    CASE WHEN t1.txn_time <= t2.txn_time THEN t2.txn_time ELSE t1.txn_time END AS second_time,
    ABS(t1.amount - t2.amount) * 1.0 / MAX(t1.amount, t2.amount) AS pct_diff_ratio,
    ABS(julianday(t1.txn_time) - julianday(t2.txn_time)) * 24 AS hours_apart
  FROM transactions AS t1
  JOIN transactions AS t2
    ON t1.from_account = t2.to_account
   AND t1.to_account = t2.from_account
   AND t1.txn_id < t2.txn_id
)
SELECT
  a1.holder_name AS account_a,
  a2.holder_name AS account_b,
  printf('%.2f', pairs.amount_out) AS amount_out,
  printf('%.2f', pairs.amount_back) AS amount_back,
  pairs.first_time,
  pairs.second_time,
  printf('%.2f', pairs.pct_diff_ratio * 100) AS pct_diff,
  printf('%.2f', pairs.hours_apart) AS hours_apart
FROM pairs
JOIN accounts AS a1 ON a1.account_id = pairs.account_a_id
JOIN accounts AS a2 ON a2.account_id = pairs.account_b_id
WHERE pairs.pct_diff_ratio <= 0.10
  AND pairs.hours_apart <= 24
ORDER BY pairs.first_time, pairs.second_time;
