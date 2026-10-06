# Streamhub QA assessment

**Paramjot Singh**<br>
[er.paramjots@gmail.com](mailto:er.paramjots@gmail.com)

[![Playwright Tests](https://github.com/Param2596/streamhub-qa-assessment/actions/workflows/ci.yml/badge.svg)](https://github.com/Param2596/streamhub-qa-assessment/actions/workflows/ci.yml)

Section B of the Streamhub QA Automation Assessment. It has a loan API, Cucumber and Playwright tests for that API, the two EMI calculator UI test cases, two SQL scenarios, and a self-healing locator exercise.

## Results

| Section | Result | Report |
|---|---|---|
| B1. API | 4 endpoints, tested from Postman | `postman/Loan-API.postman_collection.json` |
| B2. API tests | 93 scenarios, 568 steps passed | <a href="https://param2596.github.io/streamhub-qa-assessment/reports/api-cucumber.html" target="_blank">API report</a> |
| B3. UI tests | 3 scenarios, 30 steps passed | <a href="https://param2596.github.io/streamhub-qa-assessment/reports/ui-cucumber.html" target="_blank">UI report</a> |
| B4. SQL | Both queries return the expected rows | `sql/results/` |
| Self-healing | 5 brittle locators fail on purpose | <a href="https://param2596.github.io/streamhub-qa-assessment/reports/self-healing-cucumber.html" target="_blank">Self-healing report</a> |

Console logs for each run are in `reports/`.

### B1. API

A valid request returns `200` with a page of loans. An invalid parameter returns `400` with the error code and the field.

![B1 happy-path request in Postman](reports/screenshots/b1-postman-happy-path.png)

![B1 invalid request in Postman returning 400](reports/screenshots/b1-postman-error.png)

### B2. API tests

![B2 Cucumber API report, 93 of 93 passed](reports/screenshots/b2-api-report-summary.png)

### B3. UI tests

![B3 Cucumber UI report, 3 of 3 passed](reports/screenshots/b3-ui-report-summary.png)

Test case 1 checks the Home Loan EMI against an independent calculation, then checks that the pie chart is visible and both sections are above zero.

![B3 pie chart steps in the Cucumber report](reports/screenshots/b3-ui-report-summary-1.png)

Scenario A is ₹25,00,000 at 10% for 10 years, with an EMI of ₹33,038.

![B3 test case 1, scenario A](reports/screenshots/b3-scenario-a-25l-at-10-for-10-years.png)

Scenario B is ₹50,00,000 at 7.5% for 15 years, with an EMI of ₹46,351.

![B3 test case 1, scenario B](reports/screenshots/b3-scenario-b-50l-at-7-5-for-15-years.png)

Test case 2 drags the Personal Loan sliders to ₹10,00,000, 12%, and 5 years, and sets the schedule to January 2027. It then counts 10 bars and checks the 2031 tooltip against the calculated schedule.

![B3 bar chart steps in the Cucumber report](reports/screenshots/b3-ui-report-summary-2.png)

![B3 test case 2, personal loan bar chart with tooltip](reports/screenshots/b3-personal-loan-of-10l-at-12-for-5-years.png)

### B4. SQL

Scenario 1 finds round-trip transfers within 10% and 24 hours.

![B4 scenario 1, round-trip transfers](sql/results/scenario1-output.png)

![B4 scenario 1 query](sql/results/scenario1-query.png)

Scenario 2 finds players with 30 or more runs in at least three consecutive matches.

![B4 scenario 2, IPL streaks](sql/results/scenario2-output.png)

![B4 scenario 2 query](sql/results/scenario2-query.png)

### Self-healing

![Self-healing report, 0 of 5 passed on purpose](reports/screenshots/self-healing-report-summary.png)

Each scenario fails on its brittle locator. The tested replacements are in [reports/self-healing-suggestions.md](reports/self-healing-suggestions.md).

## Run it

You need Node.js 22.13 or newer.

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

`.env` is optional. The defaults are the API on `http://127.0.0.1:3000`, a separate test API on `http://127.0.0.1:3011`, and the calculator at `https://emicalculator.net/`. All URLs come from `config/env.ts`.

| Command | What it does |
|---|---|
| `npm start` | Starts the loan API for Postman |
| `npm run test:api` | Runs the API scenarios on their own server |
| `npm run test:ui` | Runs the UI scenarios against the live calculator |
| `npm run test:self-healing` | Runs the brittle locators. Expected to fail |
| `npm run suggest:locators` | Tests a replacement for each brittle locator on the live page |
| `npm run sql` | Builds the SQLite database, checks both queries, and saves screenshots |
| `npm run typecheck` | Type-checks the API, scripts, and tests |

GitHub Actions runs the typecheck, the API tests, the UI tests, and the SQL runner on every push to `main`.

## How it is built

```
src/            Express and Zod loan API, EMI and schedule logic
automation/
  features/     Gherkin: api, ui, self-healing
  steps/        Step definitions, no selectors or URLs
  pages/        Page objects: EmiCalculatorPage, LoansApi, RepaymentsApi
  support/      World, hooks, assertions, ad blocking, independent EMI math
config/         Environment variables
sql/            Schema, seed data, queries, results
docs/           Self-healing write-up
```

- The UI tests work out the expected EMI in `automation/support/emi.ts`. They don't reuse the API's code, so a bug in one cannot hide in the other.
- Locators use role, label, or visible text. The slider handle and the Highcharts bars have no role or accessible name on the live page, so those two use CSS inside the page object.
- The browser context blocks known ad hosts. The page object retries the scroll and tooltip hover when Highcharts redraws a chart.
- The API tests start their own server on port 3011. They never touch a server already running on port 3000.

### API

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/api/v1/loans` | Filters by `type`, `q`, `minAmount`, `maxAmount`. Sorts and paginates |
| `POST` | `/api/v1/loans` | Creates a loan in memory and returns `201` |
| `GET` | `/api/v1/loans/:id` | Returns one loan, or `404` |
| `GET` | `/api/v1/repayments` | Returns schedule rows. `loanId` is required, `year` is optional |

An invalid value or unknown parameter returns `400` and names the field. A wrong method returns `405`. Every error is `{ "error": { "code", "message", "field?" } }`.

### SQL choices

- Scenario 1 compares amounts in whole paise, so an exact 10% gap such as 8.40 and 7.56 counts. Exactly 24 hours also counts.
- Scenario 2 reads "consecutive" as the player's own innings, so a match the player missed does not break the streak. Suryakumar Yadav's row covers that case. Under a team-match reading, his row would drop out.

### Self-healing

`automation/steps/self-healing/brittle.steps.ts` has five broken locators: a positional CSS path, an absolute XPath, an SVG `nth-child` path, a Highcharts series index, and a hardcoded EMI text. [docs/self-healing-locators.md](docs/self-healing-locators.md) covers detection, the prompt, and validation. `npm run suggest:locators` is the working proof of concept, and it leaves the broken file unchanged.

## AI / Cursor reflection

I used Cursor Pro as my pair programmer. The brief names Claude Code but allows any similar tool.

### How I used it

- It turned the PDF into a plan for Section B, then built the folder layout, API, page objects, steps, and config from my description.
- I used it to learn Cucumber profiles and hooks, SQL window functions, Highcharts SVG, and self-healing locators.
- Twice I had it grade the repo against the brief as a Streamhub evaluator. Both reviews found real gaps.

### What worked

- It checked the live calculator before choosing locators. That is how it found that the chart has 12 points but only 10 real bars, and that the tooltip uses the unrounded EMI.
- It wrote 93 API scenarios with boundary cases, such as `limit=51`, a 101-character `q`, and malformed JSON.
- The SQL runner and the locator proof of concept both check real output. Neither trusts the model's answer.

### Where I had to correct it

- It built a read-only API and said `POST` wasn't needed. I asked for a create endpoint.
- It treated the bar count, the tooltip check, and the self-healing exercise as optional extras. The brief requires all three.
- It used playwright-bdd. The brief names Cucumber, so I switched it to `@cucumber/cucumber`.
- It took three rounds to get role, label, and text locators. It kept arguing that chart ids and CSS classes were good enough.
- Its first reflection never named the tool.
- The first review found a test URL built outside `config/env.ts`, an API server starting during UI runs, and noisy console logs.
- I asked whether decimal math could miss the exact SQL limits. The 10% check rejected 2,292 of 5,406 exact pairs with paise amounts, so it now compares whole paise.
- Scenario 1 returned columns the brief didn't ask for. I cut it down to one join.
- It listed Node 20, but `node:sqlite` needs Node 22.13.
- It added a script that only captured README images. I removed it.
- The second review found a cropped bar chart screenshot, a locator in `hooks.ts`, a typecheck that skipped the tests, and a missing combined repayments test.
- Ads on the live site failed 3 of 10 UI runs. After the browser context blocked ad hosts, 10 of 10 passed.
