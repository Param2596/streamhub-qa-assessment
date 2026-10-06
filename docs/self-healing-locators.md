# Self-healing locators

Five locators in `automation/steps/self-healing/brittle.steps.ts` are brittle on purpose, and they stay broken. `npm run test:ui` does not run them. `npm run test:self-healing` runs only those scenarios, and that run is expected to fail. A suggested replacement is not applied until the checks below pass. This exercise still leaves the broken file unchanged after those checks.

## Detection

A failure is a locator problem when the step times out looking for an element, or Playwright reports a strict-mode violation, and the page still shows the control the scenario is checking. A wrong EMI amount is not a locator failure. A selector that passes because it matched the wrong node is still a bad fix.

Each self-healing failure is kept as:

- the scenario name and the broken locator
- the Playwright error, `element(s) not found`, after a 3000ms timeout
- the screenshot attached to `reports/self-healing-cucumber.html`
- an accessibility snapshot limited to the loan form, the payment summary, and the chart

| Scenario | Broken locator | Detection signal |
|---|---|---|
| positional input for the loan amount | `div:nth-child(3) > input.loan-amount` | The locator matches no element. The amount field is a named textbox, not that CSS path. |
| absolute path for the EMI figure | `//form[@id='calculator']/div[4]/span[@class='emi-value']` | The locator matches no element. The form id, depth, and class are not on the page. |
| positional pie slice | `#emipiechart svg > g:nth-child(9) > path:nth-child(4)` | The locator matches no element. Highcharts redraws the SVG, so child positions move. |
| positional first bar | `.highcharts-series-9 > rect:nth-child(1)` | The locator matches no element. The personal-loan chart has no series 9. |
| default EMI text after the amount changes | exact text `₹ 44,986` | The locator matches no element after Scenario A. That string is only the untouched default. |

## Prompt approach

The model receives only the failed step, the error, the snapshot, and the control the step should find. It does not receive the rest of the repository. It must return one locator and nothing else.

```text
The step "<step name>" failed.
Broken locator: <locator>
Error: <timeout or strict-mode message>

Accessibility snapshot of the EMI calculator:
<snapshot>

Target: <Home Loan Amount textbox | Loan EMI figure | a pie-chart section | a bar in the payment chart | the EMI figure after the inputs change>

Return one Playwright locator.
Use getByRole, getByLabel, or visible text.
Refuse nth-child, absolute XPath, and a locator whose only check is a rupee amount that changes when the inputs change.
```

Applied to this page, that prompt produces:

- Home Loan Amount: `page.getByRole('textbox', { name: 'Home Loan Amount' })`
- Loan EMI: `page.locator('#emipaymentsummary').getByRole('heading', { name: 'Loan EMI' })`
- Pie sections: the numeric labels inside `#emipiechart`, not an SVG path
- A bar: `page.locator('#emibarchart .highcharts-column-series .highcharts-point')`
- Changed EMI: read the Loan EMI heading and compare it with `calculateEmi()`. Do not look for `₹ 44,986`.

## Validation before applying the fix

1. Run only the failing scenario: `npx cucumber-js --profile default --profile self-healing --name "<scenario name>"`.
2. Confirm the suggested locator matches the intended control and that the broken locator still matches nothing.
3. Re-run the real UI scenario that uses the same control (`npm run test:ui`) and confirm the independent EMI figures still match.
4. Review the diff. Do not edit `brittle.steps.ts` until that check passes. This exercise leaves that file broken on purpose.

`npm run suggest:locators` is the working example. It opens the live calculator, checks each replacement on the page that scenario needs, and writes the observed result to `reports/self-healing-suggestions.md`. It does not edit the test file.
