import { Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { PlaywrightWorld } from "../../support/world";

const brokenTimeout = 3_000;

Then("the positional loan amount field is visible", async function (this: PlaywrightWorld) {
  await expect(this.page.locator("div:nth-child(3) > input.loan-amount")).toBeVisible({ timeout: brokenTimeout });
});

Then("the absolute EMI figure path is visible", async function (this: PlaywrightWorld) {
  await expect(this.page.locator("xpath=//form[@id='calculator']/div[4]/span[@class='emi-value']")).toBeVisible({
    timeout: brokenTimeout,
  });
});

Then("the positional pie slice is visible", async function (this: PlaywrightWorld) {
  await expect(this.page.locator("#emipiechart svg > g:nth-child(9) > path:nth-child(4)")).toBeVisible({
    timeout: brokenTimeout,
  });
});

Then("the positional first bar is visible", async function (this: PlaywrightWorld) {
  await expect(this.page.locator(".highcharts-series-9 > rect:nth-child(1)")).toBeVisible({ timeout: brokenTimeout });
});

Then("the untouched default EMI text is visible", async function (this: PlaywrightWorld) {
  await expect(this.page.getByText("₹ 44,986", { exact: true })).toBeVisible({ timeout: brokenTimeout });
});
