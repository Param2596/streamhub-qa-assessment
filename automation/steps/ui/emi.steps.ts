import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { calculateEmi, parseBarTooltip, parseMonthYear, yearlySchedule } from "../../support/emi";
import type { PlaywrightWorld } from "../../support/world";

Given("I launch the EMI calculator", async function (this: PlaywrightWorld) {
  await this.emiPage.open();
});

When("I navigate to the Home Loan tab", async function (this: PlaywrightWorld) {
  await this.emiPage.openHomeLoan();
});

When("I navigate to the Personal Loan tab", async function (this: PlaywrightWorld) {
  await this.emiPage.openPersonalLoan();
});

When(
  "I enter a home loan of {int} at {float} percent for {int} years",
  async function (this: PlaywrightWorld, principal: number, rate: number, years: number) {
    await this.emiPage.enterHomeLoan(principal, rate, years);
  },
);

When("I set the Personal Loan Amount slider to {int}", async function (this: PlaywrightWorld, amount: number) {
  await this.emiPage.setSlider("Personal Loan Amount", amount);
});

When("I set the Interest Rate slider to {int}", async function (this: PlaywrightWorld, rate: number) {
  await this.emiPage.setSlider("Interest Rate", rate);
});

When("I set the Loan Tenure slider to {int}", async function (this: PlaywrightWorld, years: number) {
  await this.emiPage.setSlider("Loan Tenure", years);
});

When("I modify the schedule month to {string}", async function (this: PlaywrightWorld, month: string) {
  await this.emiPage.changeScheduleMonth(month);
});

Then(
  "the displayed EMI figures match the calculation for {int} at {float} percent for {int} years",
  async function (this: PlaywrightWorld, principal: number, rate: number, years: number) {
    const expected = calculateEmi(principal, rate, years);
    await expect.poll(async () => this.emiPage.emiFigures()).toEqual(expected);
  },
);

Then("the pie chart is visible", async function (this: PlaywrightWorld) {
  await this.emiPage.expectPieChartVisible();
});

Then("both sections of the pie chart show a number greater than zero", async function (this: PlaywrightWorld) {
  const values = await this.emiPage.pieSectionValues();
  expect(values, "pie chart sections").toHaveLength(2);
  expect(values[0]).toBeGreaterThan(0);
  expect(values[1]).toBeGreaterThan(0);
});

Then("the bar chart is visible", async function (this: PlaywrightWorld) {
  await this.emiPage.expectBarChartVisible();
});

Then("the bar chart contains {int} bars", async function (this: PlaywrightWorld, expected: number) {
  const count = await this.emiPage.barCount();
  this.attach(String(count), { mediaType: "text/plain", fileName: "bar-count.txt" });
  expect(count).toBe(expected);
});

Then(
  "the tooltip of a bar matches the schedule for {int} at {int} percent for {int} years starting {string}",
  async function (this: PlaywrightWorld, principal: number, rate: number, years: number, start: string) {
    const tooltip = parseBarTooltip(await this.emiPage.barTooltipText());
    const slice = yearlySchedule(principal, rate, years, parseMonthYear(start)).find((item) => item.year === tooltip.year);
    expect(slice, `schedule for ${tooltip.year}`).toBeDefined();
    const expectedAmount = tooltip.series === "Interest" ? slice!.interest : slice!.principal;
    expect(tooltip.amount).toBeGreaterThan(0);
    expect(tooltip.totalPayment).toBeGreaterThan(0);
    expect(Math.abs(tooltip.amount - expectedAmount)).toBeLessThanOrEqual(1);
    expect(Math.abs(tooltip.totalPayment - slice!.totalPayment)).toBeLessThanOrEqual(1);
  },
);
