import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright";

const root = process.cwd();
const sqlDir = path.join(root, "sql");
const outDir = path.join(sqlDir, "results");

function readSql(name: string): string {
  return fs.readFileSync(path.join(sqlDir, name), "utf8");
}

function writeText(name: string, rows: Record<string, unknown>[]): void {
  const header = rows.length === 0 ? "" : Object.keys(rows[0]).join(" | ");
  const body = rows.map((row) => Object.values(row).join(" | ")).join("\n");
  fs.writeFileSync(path.join(outDir, name), `${header}\n${body}\n`);
}

function table(columns: string[], rows: Record<string, unknown>[]): string {
  const head = columns.map((column) => `<th>${column}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((column) => `<td>${String(row[column] ?? "")}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const expectedRoundTrips = [
  ["Alice", "Bob", "10000.00", "10000.00", "2026-03-01 10:00:00", "2026-03-01 11:00:00"],
  ["Alice", "Bob", "10000.00", "9000.00", "2026-03-05 10:00:00", "2026-03-05 12:00:00"],
  ["Alice", "Bob", "10000.00", "9000.00", "2026-03-10 10:00:00", "2026-03-11 10:00:00"],
  ["Alice", "Bob", "20000.00", "19000.00", "2026-04-01 08:00:00", "2026-04-01 18:00:00"],
  ["Bob", "Alice", "4000.00", "4200.00", "2026-04-05 08:00:00", "2026-04-05 20:00:00"],
  ["Alice", "Bob", "8.40", "7.56", "2026-04-10 08:00:00", "2026-04-10 14:00:00"],
];

const expectedStreaks = [
  ["Rishabh Pant", "2024-03-23", 3],
  ["Rohit Sharma", "2024-03-24", 3],
  ["Suryakumar Yadav", "2024-03-24", 3],
  ["Virat Kohli", "2024-03-25", 4],
  ["Shubman Gill", "2024-04-06", 3],
  ["Rishabh Pant", "2024-04-09", 3],
];

fs.mkdirSync(outDir, { recursive: true });
const dbPath = path.join(outDir, "streamhub.db");
try {
  fs.rmSync(dbPath, { force: true });
} catch {
  // A viewer may still have the previous file open.
}
const db = new DatabaseSync(fs.existsSync(dbPath) ? path.join(outDir, `streamhub-${Date.now()}.db`) : dbPath);
db.exec("PRAGMA foreign_keys = ON");
db.exec(readSql("schema.sql"));
db.exec(readSql("seed.sql"));

let selfTransfer = "rejected";
try {
  db.prepare(
    "INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_time) VALUES (99, 1, 1, 1000, '2026-04-10 10:00:00')",
  ).run();
  selfTransfer = "inserted";
} catch {
  selfTransfer = "rejected";
}
if (selfTransfer !== "rejected") {
  throw new Error("A self-transfer was inserted");
}

const roundTrips = db.prepare(readSql("scenario1-round-trip.sql")).all() as Record<string, unknown>[];
const streaks = db.prepare(readSql("scenario2-ipl-streak.sql")).all() as Record<string, unknown>[];

const actualTrips = roundTrips.map((row) => [
  row.account_a,
  row.account_b,
  row.amount_out,
  row.amount_back,
  row.first_time,
  row.second_time,
]);
const actualStreaks = streaks.map((row) => [row.player_name, row.streak_commenced, row.matches_in_streak]);

if (JSON.stringify(actualTrips) !== JSON.stringify(expectedRoundTrips)) {
  console.log(actualTrips);
  throw new Error("Scenario 1 output did not match the expected round trips");
}
if (JSON.stringify(actualStreaks) !== JSON.stringify(expectedStreaks)) {
  console.log(actualStreaks);
  throw new Error("Scenario 2 output did not match the expected streaks");
}

writeText("scenario1.txt", roundTrips);
writeText("scenario2.txt", streaks);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>B4 SQL query output</title>
  <style>
    body { font-family: Georgia, serif; margin: 32px; color: #e6edf3; background: #0d1117; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 28px 0 8px; }
    p, pre { font-family: Consolas, monospace; font-size: 13px; }
    pre { display: table; background: #161b22; border: 1px solid #30363d; padding: 12px; white-space: pre; color: #e6edf3; }
    table { border-collapse: collapse; background: #161b22; margin-top: 8px; }
    th, td { border: 1px solid #30363d; padding: 6px 10px; font-family: Consolas, monospace; font-size: 13px; }
    th { background: #21262d; text-align: left; }
    section { margin-bottom: 28px; }
  </style>
</head>
<body>
  <section id="scenario-1">
    <div id="scenario-1-result">
    <h1>Scenario 1 — round trip within 24 hours and 10%</h1>
    <p>Self-transfer Alice to Alice: ${selfTransfer} by CHECK (from_account &lt;&gt; to_account).</p>
    ${table(
      ["account_a", "account_b", "amount_out", "amount_back", "first_time", "second_time"],
      roundTrips,
    )}
    </div>
    <pre id="scenario-1-query">${readSql("scenario1-round-trip.sql").replace(/</g, "&lt;")}</pre>
  </section>
  <section id="scenario-2">
    <div id="scenario-2-result">
    <h1>Scenario 2 — IPL 2024 streaks of 30 or more in three consecutive innings</h1>
    ${table(["player_name", "streak_commenced", "matches_in_streak"], streaks)}
    </div>
    <pre id="scenario-2-query">${readSql("scenario2-ipl-streak.sql").replace(/</g, "&lt;")}</pre>
  </section>
</body>
</html>
`;

const htmlPath = path.join(outDir, "query-output.html");
fs.writeFileSync(htmlPath, html);

async function capture(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.locator("#scenario-1-result").screenshot({ path: path.join(outDir, "scenario1-output.png") });
  await page.locator("#scenario-1-query").screenshot({ path: path.join(outDir, "scenario1-query.png") });
  await page.locator("#scenario-2-result").screenshot({ path: path.join(outDir, "scenario2-output.png") });
  await page.locator("#scenario-2-query").screenshot({ path: path.join(outDir, "scenario2-query.png") });
  await browser.close();
}

capture()
  .then(() => {
    db.close();
    console.log(`Scenario 1 rows: ${roundTrips.length}`);
    console.log(`Scenario 2 rows: ${streaks.length}`);
    console.log(`Screenshots written to ${outDir}`);
  })
  .catch((error: unknown) => {
    db.close();
    console.error(error);
    process.exit(1);
  });
