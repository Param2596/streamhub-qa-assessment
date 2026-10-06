import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { capture } from "../../support/capture";
import { asLoan, asRepaymentPage, expectStatus } from "../../support/assertions";
import { seedLoan } from "../../support/seed";
import type { ApiResult, Repayment } from "../../support/types";
import type { PlaywrightWorld } from "../../support/world";

When("I list repayments", async function (this: PlaywrightWorld) {
  await capture(await this.repaymentsApi.list(), this.api);
});

When("I list repayments with query {string}", async function (this: PlaywrightWorld, query: string) {
  await capture(await this.repaymentsApi.list(query), this.api);
});

Then("the response is a repayment page", async function (this: PlaywrightWorld) {
  const page = asRepaymentPage(this.api);
  expect(page.data.length).toBeLessThanOrEqual(page.meta.limit);
});

Then("the repayment page meta is page {int} and limit {int}", async function (this: PlaywrightWorld, page: number, limit: number) {
  const body = asRepaymentPage(this.api);
  expect(body.meta.page).toBe(page);
  expect(body.meta.limit).toBe(limit);
});

Then("the repayment total is {int}", async function (this: PlaywrightWorld, total: number) {
  expect(asRepaymentPage(this.api).meta.total).toBe(total);
});

Then(
  "every repayment row belongs to loan {int} and year {int}",
  async function (this: PlaywrightWorld, loanId: number, year: number) {
    const rows = asRepaymentPage(this.api).data;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.loanId === loanId && row.year === year)).toBe(true);
  },
);

Then("the first repayment for loan {int} matches the amortized opening row", async function (this: PlaywrightWorld, loanId: number) {
  const row = asRepaymentPage(this.api).data[0];
  expect(row).toEqual(openingRow(loanId));
});

Then("the created schedule repays the new loan", async function (this: PlaywrightWorld) {
  const created = asLoan(this.api);
  const rows = await listAll(this.repaymentsApi, created.id);
  expect(rows).toHaveLength(created.tenureMonths);
  expect(rows[rows.length - 1].balance).toBe(0);
  const principal = rows.reduce((sum, row) => sum + row.principalComponent, 0);
  expect(roundPaise(principal)).toBe(created.amount);
});

Then("the full schedule for loan {int} repays the principal", async function (this: PlaywrightWorld, loanId: number) {
  const rows = await listAll(this.repaymentsApi, loanId);
  const loan = seedLoan(loanId);
  expect(rows).toHaveLength(loan.tenureMonths);
  expect(rows[0]).toEqual(openingRow(loanId));
  expect(rows[rows.length - 1].balance).toBe(0);
  expect(rows.every((row, index) => index === 0 || row.balance <= rows[index - 1].balance)).toBe(true);
  const principal = rows.reduce((sum, row) => sum + row.principalComponent, 0);
  expect(roundPaise(principal)).toBe(loan.amount);
});

function openingRow(loanId: number): Repayment {
  if (loanId !== 1) {
    throw new Error(`Opening row is pinned for loan 1, received ${loanId}`);
  }
  return {
    loanId: 1,
    year: 2026,
    month: 1,
    principalComponent: 12204.35,
    interestComponent: 20833.33,
    emi: 33037.68,
    balance: 2487795.65,
  };
}

async function listAll(
  repaymentsApi: { list(query?: string): Promise<import("@playwright/test").APIResponse> },
  loanId: number,
): Promise<Repayment[]> {
  const rows: Repayment[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const result: ApiResult = { status: 0, contentType: "", body: undefined };
    await capture(await repaymentsApi.list(`loanId=${loanId}&limit=50&page=${page}`), result);
    expectStatus(result, 200);
    const body = asRepaymentPage(result);
    rows.push(...body.data);
    totalPages = body.meta.totalPages;
    page += 1;
  }
  return rows;
}

function roundPaise(amount: number): number {
  return Math.round(amount * 100) / 100;
}
