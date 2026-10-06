# Streamhub QA assessment

**Paramjot Singh**<br>
[er.paramjots@gmail.com](mailto:er.paramjots@gmail.com)

This repo is a solution to Section B of the Streamhub Fullstack + QA Automation Assessment. It has a small loan API, Cucumber tests that call the API with Playwright, the two EMI calculator UI test cases, two SQL scenarios, and a self-healing locator exercise. Section A is not attempted. The brief asks for one section.

## Results at a glance

These results are from the last run on 6 October 2026.

| Section | Result | Report | Console log |
|---|---|---|---|
| B1. Build an API | 4 endpoints, sent from Postman | `postman/Loan-API.postman_collection.json` | |
| B2. API automation | 92 scenarios and 560 steps passed | `reports/api-cucumber.html` | `reports/api-run-console.txt` |
| B3. UI test cases | 3 scenarios and 30 steps passed | `reports/ui-cucumber.html` | `reports/ui-run-console.txt` |
| B4. SQL tests | Scenario 1 returned 6 rows and scenario 2 returned 6, both matching the expected rows | `sql/results/` | `sql/results/scenario1.txt`, `sql/results/scenario2.txt` |
| Self-healing exercise | 5 scenarios failed on purpose, one per brittle locator | `reports/self-healing-cucumber.html` | `reports/self-healing-run-console.txt` |

GitHub shows HTML files as source. Download an HTML report and open it in a browser to see every step. The images below are in `reports/screenshots/` and `sql/results/`.

### B1. Build an API

The loan API running locally, with requests sent from the Postman collection.

A valid list request returns `200` with a page of loans.

![B1 happy-path request in Postman](reports/screenshots/b1-postman-happy-path.png)

An invalid parameter returns `400` with the error code and field.

![B1 invalid request in Postman returning 400](reports/screenshots/b1-postman-error.png)

### B2. API automation

![B2 Cucumber API report, 92 of 92 passed](reports/screenshots/b2-api-report-summary.png)

### B3. UI test cases

The UI report is 3 of 3 passed. The file list is alphabetical, so the bar chart feature is above the pie chart feature. The tests ran the pie chart first.

![B3 Cucumber UI report, 3 of 3 passed](reports/screenshots/b3-ui-report-summary.png)

#### Test case 1, pie chart

Both examples passed. Each one checks the calculated EMI, that the pie chart is visible, and that both sections are greater than zero.

![B3 pie chart steps in the Cucumber report](reports/screenshots/b3-ui-report-summary-1.png)

Scenario A is ₹25,00,000 at 10% for 10 years. The displayed EMI is ₹33,038.

![B3 test case 1, scenario A](reports/screenshots/b3-scenario-a-25l-at-10-for-10-years.png)

Scenario B is ₹50,00,000 at 7.5% for 15 years. The displayed EMI is ₹46,351.

![B3 test case 1, scenario B](reports/screenshots/b3-scenario-b-50l-at-7-5-for-15-years.png)

#### Test case 2, bar chart

The scenario passed. It sets the three sliders, changes the schedule month to January 2027, checks that the chart is visible, counts 10 bars, and checks one tooltip against the calculated schedule.

![B3 bar chart steps in the Cucumber report](reports/screenshots/b3-ui-report-summary-2.png)

The page after that run. The open tooltip is for 2031.

![B3 test case 2, personal loan bar chart with tooltip](reports/screenshots/b3-personal-loan-of-10l-at-12-for-5-years.png)

### B4. SQL tests

Scenario 1 finds round-trip transfers within 10% and 24 hours.

![B4 scenario 1, round-trip transfers](sql/results/scenario1-output.png)

![B4 scenario 1 query](sql/results/scenario1-query.png)

Scenario 2 finds streaks of 30 or more runs in at least three consecutive matches.

![B4 scenario 2, IPL streaks](sql/results/scenario2-output.png)

![B4 scenario 2 query](sql/results/scenario2-query.png)

### Self-healing exercise

![Self-healing report, 0 of 5 passed on purpose](reports/screenshots/self-healing-report-summary.png)

All five scenarios fail on their brittle locator, which is the intended result. The screenshot of each failure is in `reports/screenshots/`. The suggested replacements are in `reports/self-healing-suggestions.md`.

## Setup

You need Node.js 22.13 or newer. The SQL runner uses Node's built-in `node:sqlite`, which prints an experimental warning on Node 24.

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

`.env` is optional. Without it the API listens on `http://127.0.0.1:3000`, the API tests start a separate server on `http://127.0.0.1:3011`, and the UI tests open `https://emicalculator.net/`.

| Variable | Default | Used by |
|---|---|---|
| `API_PORT`, `API_BASE_URL` | `3000`, `http://127.0.0.1:3000` | `npm start` |
| `TEST_API_PORT`, `TEST_API_BASE_URL` | `3011`, `http://127.0.0.1:3011` | `npm run test:api` |
| `EMI_BASE_URL` | `https://emicalculator.net/` | UI, self-healing, and `suggest:locators` |
| `DEFAULT_PAGE`, `DEFAULT_LIMIT`, `MAX_LIMIT` | `1`, `10`, `50` | API pagination |

All URLs come from `config/env.ts`. Feature files, step definitions, and page objects contain no URLs.

## How to run

| Command | What it does | Output |
|---|---|---|
| `npm start` | Starts the loan API for Postman or a browser | `http://127.0.0.1:3000` |
| `npm run dev` | Starts the same API and restarts it when a file changes | |
| `npm run test:api` | Runs the Cucumber `@api` scenarios | `reports/api-cucumber.html` |
| `npm run test:ui` | Runs the Cucumber `@ui` scenarios against the live calculator | `reports/ui-cucumber.html` |
| `npm run test:self-healing` | Runs the five brittle locators. This run is expected to fail | `reports/self-healing-cucumber.html` |
| `npm run suggest:locators` | Checks replacement locators on the live calculator and writes the result. It does not edit the broken steps | `reports/self-healing-suggestions.md` |
| `npm run sql` | Builds the SQLite database, runs both queries, checks the rows, and screenshots the result tables | `sql/results/` |
| `npm run results:capture` | Captures the summary screen of each Cucumber report for this README. Run it after the test suites | `reports/screenshots/` |
| `npm run generate:repayments` | Rebuilds `src/api/data/repayments.json` from the loan file | |
| `npm run typecheck` | Runs `tsc --noEmit` | |

The API tests do not use the server on port 3000. They start their own process on `TEST_API_PORT` and stop it when the run finishes.

To try the API by hand, run `npm start` and import `postman/Loan-API.postman_collection.json` into Postman.

## Architecture

```
src/api/            Express app, Zod validation, in-memory catalog
src/domain/         EMI formula and repayment schedule
src/api/data/       loans.json seed, repayments.json generated
automation/
  features/         Gherkin feature files: api, ui, self-healing
  steps/            Step definitions
  pages/            Page objects: EmiCalculatorPage, LoansApi, RepaymentsApi
  support/          Cucumber world, hooks, assertions, display EMI math
config/             Environment variables and project root
sql/                Schema, seed data, queries, results
scripts/            SQL runner, locator suggestions, repayment generator
docs/               Self-healing write-up
postman/            Postman collection
reports/            Cucumber reports and console logs
```

Cucumber runs the tests from `cucumber.js`. Playwright launches Chromium for the UI scenarios and sends the API requests. Step definitions call page objects. The UI steps contain no selectors. The API page objects wrap each endpoint, so steps never build URLs.

`cucumber.js` keeps the feature paths and TypeScript loading on the `default` profile. Each npm script passes `--profile default` and a named profile such as `--profile api`, because a named profile does not inherit `default` on its own.

### Loan API

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/api/v1/loans` | Filters, sorts, and paginates loans |
| `POST` | `/api/v1/loans` | Creates a loan and its schedule, returns `201` |
| `GET` | `/api/v1/loans/:id` | Returns one loan, or `404` |
| `GET` | `/api/v1/repayments` | Returns schedule rows. `loanId` is required |

The list filters are `type`, `q`, `minAmount`, `maxAmount`, `sort`, `order`, `page`, and `limit`. `type` is `home`, `personal`, or `car`, and the match ignores case. `q` matches the name or the lender. `/repayments` also accepts `year`. The default page size is 10 and the maximum is 50. An invalid value returns `400` with the field name. An unknown query key returns `400`. The wrong method on a known path returns `405`, and an unknown path returns `404`.

Every error has the shape `{ "error": { "code", "message", "field?" } }`.

`POST` keeps the new loan in memory only, so a restart drops it. The body cannot include `id`. The seed file has loans 1 to 18. Schedules start in January 2026. Each row stores principal, interest, EMI, and remaining balance in rupees to two decimal places, and the last month clears the balance.

The API tests cover a happy path for each endpoint and parameter, combinations of parameters, pagination past the end, out-of-range and wrong-type values, missing required parameters, unknown parameters, wrong methods, and malformed `POST` bodies. Each check asserts the status code and the response shape.

### EMI figures

The calculator and the API both use `E = P * r * (1 + r)^n / ((1 + r)^n - 1)`, with `r = annual / 12 / 100`.

The tests compute the expected figures in `automation/support/emi.ts` and compare them with the page. The summary on the website rounds the monthly EMI to the nearest rupee. Total payment is `round(raw EMI × months)`. Interest is total payment minus principal. The bar tooltip does not use the rounded monthly EMI. Its yearly interest and total are the raw EMI summed for the year, then rounded. The tooltip check allows a difference of 1 rupee.

### UI scenarios

- Test case 1 is the Home Loan pie chart, with two examples. They are ₹25,00,000 at 10% for 10 years and ₹50,00,000 at 7.5% for 15 years. The displayed EMI, interest, and total must match the calculation. The pie chart must be visible, and both of its sections must be greater than zero.
- Test case 2 is the Personal Loan bar chart. The test drags the three sliders to ₹10,00,000, 12%, and 5 years, then sets the schedule month to January 2027 in the calendar. The bar chart must be visible and must have 10 column bars. The tooltip of one bar must match that year's interest, principal, and total from the calculated schedule.

The tabs, the amount, rate, and tenure fields, the year radio, the schedule field, the EMI headings, the calendar, and the chart roots use role, label, or text locators. Two widget internals do not, because the live page gives them no role and no accessible name.

- The slider handle is `#${inputId}slider` plus `.ui-slider-handle`. `getByRole("slider")` matches nothing on this page.
- The bars and the tooltip are Highcharts nodes inside the bar-chart image. The count excludes legend swatches. The tooltip hover uses the tallest column, not `.first()`.

The UI tests run against the live site, so two things on that site can break them. Highcharts redraws a chart after an input changes, so the page object retries the scroll and the tooltip hover. Google ad overlays sometimes add a second element named "Personal Loan", so the tab locator also filters by the visible text.

### SQL

`npm run sql` creates a SQLite database and runs the files in `sql/`. `sql/schema.sql` has the tables, `sql/seed.sql` has the data and a comment on each case, and the two query files hold the answers. The runner checks the returned rows against the expected rows before it writes the screenshots.

Scenario 1 returns a payment and the payment back when the amounts are within 10% and the times are within 24 hours. `account_a` is whoever paid first. The seed also includes an 11% gap, a gap of 24 hours and one minute, and a payment that continues to a third account. The query leaves those out. A check constraint rejects a transfer from an account to itself.

Scenario 2 returns each player with 30 or more runs in at least three consecutive matches, with the date the streak started. The query numbers each player's innings with `ROW_NUMBER()` and groups the runs of 30 or more into streaks. "Consecutive" here means the player's own consecutive matches, so a match the player did not play does not break the streak. A score under 30 does break it. A streak of four matches is one row, dated on its first match. `matches_in_streak` is an extra column, so the screenshot shows why each row qualified.

The brief could also mean the team's consecutive matches. Under that reading, Suryakumar Yadav's row would drop out, because he missed MI's match on 2024-03-28. The seed data includes that case on purpose.

### Self-healing

`automation/steps/self-healing/brittle.steps.ts` has five locators that are wrong on purpose. They are a positional CSS path, an absolute XPath, an SVG `nth-child` path, a Highcharts series index, and the untouched default text `₹ 44,986`. `npm run test:ui` does not run them, and nothing replaces them.

[docs/self-healing-locators.md](docs/self-healing-locators.md) explains how a failure is detected, the prompt used to suggest a replacement, and the checks required before a fix is applied. `npm run suggest:locators` is the working example. It opens the live calculator, checks each replacement, and writes `reports/self-healing-suggestions.md`. It confirms that `brittle.steps.ts` is unchanged afterwards.

## AI / Cursor reflection

Cursor Pro was my pair programmer for the whole project. I chose Cursor Pro over Claude Code, and the brief allows any similar AI tool.

### How I used it

- I gave it the assessment PDF and asked for a plan for Section B that covered every requirement. Before writing the UI plan, it opened the live calculator to check the tabs, fields, and charts.
- I described the framework I wanted, and it scaffolded the folders, the Express and Zod API, the JSON data, the page objects, the step definitions, and the config.
- I iterated with it. I asked how the API was structured, whether it had pagination, and how to test it in Postman. I asked it to add `POST`, to cover the B3 steps, and to add the bar count and tooltip checks. I also asked it to move the tests to Cucumber and to write the self-healing exercise.
- I used it for unfamiliar parts. These were Cucumber profiles and hooks, the window-function approach to the SQL streak, reading Highcharts SVG, and the self-healing approach.
- I used it as a reviewer. Near the end I asked it to grade the repo against the brief as a Streamhub evaluator would. That review found the fixes listed at the end of this section.

### What worked

- The plan mapped each line of the PDF to a file, so nothing in Section B was missed.
- The scaffold ran on the first day. It had three endpoints, validation that names the bad field, and a generated repayment schedule.
- It wrote 92 API scenarios with boundary values, such as `page=1000001`, `limit=51`, a 101-character `q`, and malformed JSON.
- It inspected the live page before choosing locators. That is how it found that the slider handle has no role and that the chart's accessible name starts with "Created with Highcharts". It also found that the chart has 12 points and 10 real bars, and that the tooltip uses the unrounded EMI.
- The SQL streak query uses `ROW_NUMBER()` to group consecutive innings. The runner asserts the exact expected rows, so a wrong query fails before any screenshot is written.
- The self-healing proof of concept checks each suggestion on the live page instead of trusting the model's answer.

### What did not work, and what I corrected

The first version was often the wrong method. I had to point it back at the brief several times.

- The first API was read-only. It said `POST` was not needed because the brief only asks for an API that returns data. I asked for a simple create endpoint. Created loans stay in memory, so the list checks that do not filter by type expect a total of at least 18, not exactly 18.
- For B3 I told it to ask before adding anything. It covered the two test cases and left out the self-healing exercise, the expected bar count, and the tooltip check against the schedule. It listed them as possible extras instead of treating them as part of the brief. I asked for all three.
- The first runner was playwright-bdd, which compiles Gherkin into Playwright tests. The brief names Cucumber, so I asked for `@cucumber/cucumber`. The first Cucumber command passed only `--profile api` and found 0 scenarios, because that profile does not inherit the feature paths from `default`.
- On locators it took three rounds. First it agreed with a review that the chart ids and Highcharts classes were "the best available" and could ship. Then it said nothing outside the self-healing file was brittle. I pointed at `emi-calculator.page.ts`, which still used a parent step, `.first()`, datepicker classes, and chart ids. Its next pass removed the positional selectors but still used CSS. I asked again for role, label, and text, and that pass moved the calendar, the headings, and the charts to role and text locators.
- The first draft of this reflection listed the problems but never named the tool. The brief asks for that by name.
- The evaluator review found problems the earlier passes had missed. The test API URL was built in `hooks.ts` instead of `config/env.ts`. The profile check started the API server during UI runs. The console logs included PowerShell error text and a dotenv banner. A final UI run failed twice on the live site, first on a chart redraw and then on the Google ad link it had flagged earlier but not fixed. All of these are fixed now.

### Problems found while making those fixes

- SVG nodes have no `innerText`, so the tests read pie labels and the tooltip from `textContent`. The tooltip text runs together as `2027Interest`, so a word-boundary regex never matched the series name.
- Counting every `.highcharts-point` returned 12. Ten are columns and two are legend swatches. Calling `evaluateHandle` on the bar locator failed strict mode because that locator matches every column, so the handle now comes from the chart root.
- Rounding the monthly EMI first is correct for the summary, but it differs from the tooltip by a few rupees.
- `getByRole("img", { name: /Break-up of Total Payment/ })` matched nothing, because the image's accessible name starts with "Created with Highcharts". Filtering `getByRole("img")` by the visible text works.
- `getByRole("heading", { name: "Loan EMI" })` matched two headings. The name check is a substring, and the page also has "Home Loan EMI Calculator". The test uses `/^Loan EMI$/`.
- The loan type enum could not take both `required_error` and a custom error map in Zod, and the server crashed on startup until `required_error` was removed. An unknown JSON key such as `id` reported no field name, because Zod leaves `path` empty for that issue. The handler reads `issue.keys` instead.
- Port 3000 was already in use on my machine during development. The API tests use their own port, 3011, so they never connect to a server someone else started.
