-- Account A pays Account B, and B pays a similar amount back within 24 hours.

SELECT
  a1.holder_name AS account_a,
  a2.holder_name AS account_b,
  printf('%.2f', t1.amount) AS amount_out,
  printf('%.2f', t2.amount) AS amount_back,
  t1.txn_time AS first_time,
  t2.txn_time AS second_time
FROM transactions AS t1
JOIN transactions AS t2
  ON t2.from_account = t1.to_account
 AND t2.to_account = t1.from_account
 AND t2.txn_time > t1.txn_time
 AND t2.txn_time <= datetime(t1.txn_time, '+24 hours')
 AND ABS(ROUND(t1.amount * 100) - ROUND(t2.amount * 100)) * 10
     <= MAX(ROUND(t1.amount * 100), ROUND(t2.amount * 100))
JOIN accounts AS a1 ON a1.account_id = t1.from_account
JOIN accounts AS a2 ON a2.account_id = t1.to_account
ORDER BY t1.txn_time, t2.txn_time;
