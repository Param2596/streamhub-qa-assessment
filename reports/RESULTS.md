# Test execution summary

These results are from the last run on 6 October 2026. The artifacts are under `reports/` and `sql/results/`. Download an HTML report and open it in a browser for the full Cucumber output and the UI screenshots.

| Suite | Result | Artifacts |
|---|---|---|
| API, `npm run test:api` | 92 scenarios and 560 steps passed | `api-cucumber.html`, `api-run-console.txt` |
| UI, `npm run test:ui` | 3 scenarios and 30 steps passed | `ui-cucumber.html`, `ui-run-console.txt` |
| Self-healing, `npm run test:self-healing` | 5 scenarios failed on purpose. See `docs/self-healing-locators.md` | `self-healing-cucumber.html`, `self-healing-run-console.txt` |
| Locator suggestions, `npm run suggest:locators` | 5 replacements checked on the live page | `self-healing-suggestions.md` |
| SQL scenario 1, `npm run sql` | 5 round-trip transfers within 10% and 24 hours | `sql/results/scenario1.txt`, `sql/results/scenario1-output.png` |
| SQL scenario 2, `npm run sql` | 6 streaks of 30 or more runs in at least three consecutive matches | `sql/results/scenario2.txt`, `sql/results/scenario2-output.png` |

Run the npm scripts in the README to refresh these files.
