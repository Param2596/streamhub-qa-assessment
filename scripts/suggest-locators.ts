import fs from "fs";
import path from "path";
import { chromium, expect, type Page } from "@playwright/test";
import { env } from "../config/env";
import { EmiCalculatorPage } from "../automation/pages/emi-calculator.page";
import { blockAds } from "../automation/support/block-ads";
import { calculateEmi } from "../automation/support/emi";

const brittlePath = path.join(process.cwd(), "automation", "steps", "self-healing", "brittle.steps.ts");
const outputPath = path.join(process.cwd(), "reports", "self-healing-suggestions.md");

const brokenLocators = [
  "div:nth-child(3) > input.loan-amount",
  "xpath=//form[@id='calculator']/div[4]/span[@class='emi-value']",
  "#emipiechart svg > g:nth-child(9) > path:nth-child(4)",
  ".highcharts-series-9 > rect:nth-child(1)",
  'getByText("₹ 44,986", { exact: true })',
];

type Check = {
  target: string;
  scenario: string;
  broken: string;
  suggested: string;
  detection: string;
  validation: string;
};

async function main(): Promise<void> {
  const original = fs.readFileSync(brittlePath, "utf8");
  for (const locator of brokenLocators) {
    if (!original.includes(locator)) {
      throw new Error(`brittle.steps.ts no longer contains the broken locator: ${locator}`);
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: env.emiBaseUrl,
    viewport: { width: 1440, height: 900 },
  });
  await blockAds(context);
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const calculator = new EmiCalculatorPage(page);

  try {
    await calculator.open();
    await calculator.openHomeLoan();
    const checks = [
      await checkAmount(page),
      await checkEmiHeading(page),
      await checkPie(page, calculator),
      await checkBar(page, calculator),
      await checkChangedEmi(page, calculator),
    ];
    writeReport(checks);
  } finally {
    await browser.close();
  }

  const after = fs.readFileSync(brittlePath, "utf8");
  if (after !== original) {
    throw new Error("brittle.steps.ts was modified");
  }
  console.log(`Wrote suggestions to ${outputPath}`);
  console.log("brittle.steps.ts was not modified.");
}

async function checkAmount(page: Page): Promise<Check> {
  const broken = page.locator("div:nth-child(3) > input.loan-amount");
  const healed = page.getByRole("textbox", { name: "Home Loan Amount" });
  const brokenCount = await broken.count();
  await expect(healed).toHaveCount(1);
  await expect(healed).toBeVisible();
  return {
    target: "Home Loan Amount",
    scenario: "positional input for the loan amount",
    broken: "div:nth-child(3) > input.loan-amount",
    suggested: "page.getByRole('textbox', { name: 'Home Loan Amount' })",
    detection: `The step hit a visibility timeout. The broken CSS path matched ${brokenCount} elements. The Home Loan Amount textbox was on the page.`,
    validation: `The replacement matched ${await healed.count()} visible textbox. The broken locator still matches ${brokenCount}.`,
  };
}

async function checkEmiHeading(page: Page): Promise<Check> {
  const broken = page.locator("xpath=//form[@id='calculator']/div[4]/span[@class='emi-value']");
  const healed = page.locator("#emipaymentsummary").getByRole("heading", { name: "Loan EMI" });
  const brokenCount = await broken.count();
  await expect(healed).toHaveCount(1);
  await expect(healed).toBeVisible();
  return {
    target: "Loan EMI figure",
    scenario: "absolute path for the EMI figure",
    broken: "xpath=//form[@id='calculator']/div[4]/span[@class='emi-value']",
    suggested: "page.locator('#emipaymentsummary').getByRole('heading', { name: 'Loan EMI' })",
    detection: `The step hit a visibility timeout. The absolute XPath matched ${brokenCount} elements. The payment summary still shows a Loan EMI heading.`,
    validation: `The replacement matched ${await healed.count()} heading. The broken locator still matches ${brokenCount}.`,
  };
}

async function checkPie(page: Page, calculator: EmiCalculatorPage): Promise<Check> {
  const broken = page.locator("#emipiechart svg > g:nth-child(9) > path:nth-child(4)");
  const brokenCount = await broken.count();
  const values = await calculator.pieSectionValues();
  expect(values, "pie chart sections").toHaveLength(2);
  expect(values[0]).toBeGreaterThan(0);
  expect(values[1]).toBeGreaterThan(0);
  return {
    target: "Pie chart sections",
    scenario: "positional pie slice",
    broken: "#emipiechart svg > g:nth-child(9) > path:nth-child(4)",
    suggested: "page.locator('#emipiechart').locator('text').filter({ hasText: /\\d/ })",
    detection: `The step hit a visibility timeout. The positional SVG path matched ${brokenCount} elements. The chart still has two numeric section labels.`,
    validation: `The replacement read section values ${values.join(" and ")}. Both are greater than zero. The broken locator still matches ${brokenCount}.`,
  };
}

async function checkBar(page: Page, calculator: EmiCalculatorPage): Promise<Check> {
  await calculator.openPersonalLoan();
  await calculator.expectBarChartVisible();
  const broken = page.locator(".highcharts-series-9 > rect:nth-child(1)");
  const healed = page.locator("#emibarchart .highcharts-column-series .highcharts-point");
  const brokenCount = await broken.count();
  const healedCount = await healed.count();
  expect(healedCount).toBeGreaterThan(0);
  await expect(healed.first()).toBeVisible();
  return {
    target: "A bar in the payment chart",
    scenario: "positional first bar",
    broken: ".highcharts-series-9 > rect:nth-child(1)",
    suggested: "page.locator('#emibarchart .highcharts-column-series .highcharts-point')",
    detection: `The step hit a visibility timeout. Series 9 matched ${brokenCount} elements. Column bars are present in #emibarchart.`,
    validation: `The replacement matched ${healedCount} column bars, and the first is visible. The broken locator still matches ${brokenCount}.`,
  };
}

async function checkChangedEmi(page: Page, calculator: EmiCalculatorPage): Promise<Check> {
  await calculator.openHomeLoan();
  await calculator.enterHomeLoan(2_500_000, 10, 10);
  const expected = calculateEmi(2_500_000, 10, 10);
  await expect.poll(async () => calculator.emiFigures()).toEqual(expected);
  const staleCount = await page.getByText("₹ 44,986", { exact: true }).count();
  expect(staleCount).toBe(0);
  return {
    target: "The EMI figure after the inputs change",
    scenario: "default EMI text after the amount changes",
    broken: "getByText('₹ 44,986', { exact: true })",
    suggested: "Read the Loan EMI heading and compare it with calculateEmi(), not with a hardcoded default amount",
    detection: "The step hit a visibility timeout after Scenario A. ₹ 44,986 is the untouched default. It is gone once the amount, rate, and tenure change.",
    validation: `The displayed EMI is ${expected.emi}, which matches calculateEmi(2500000, 10, 10). The stale text matches ${staleCount} elements.`,
  };
}

function writeReport(checks: Check[]): void {
  const lines = [
    "# Suggested locator replacements",
    "",
    "Generated by `npm run suggest:locators` from the approach in `docs/self-healing-locators.md`.",
    "`npm run suggest:locators` checked each replacement on the live EMI calculator. It did not modify `brittle.steps.ts`.",
    "",
  ];
  for (const check of checks) {
    lines.push(
      `## ${check.target}`,
      "",
      `- Scenario: ${check.scenario}`,
      `- Broken: \`${check.broken}\``,
      `- Detection: ${check.detection}`,
      `- Suggested: \`${check.suggested}\``,
      `- Validation: ${check.validation}`,
      "",
    );
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, lines.join("\n"));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
