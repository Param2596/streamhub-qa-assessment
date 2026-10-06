import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { capture } from "../../support/capture";
import { asLoan, asLoanPage, expectError, expectSorted, expectStatus } from "../../support/assertions";
import { seedLoan, seedLoansOfType } from "../../support/seed";
import type { Loan } from "../../support/types";
import type { PlaywrightWorld } from "../../support/world";

When("I list loans", async function (this: PlaywrightWorld) {
  await capture(await this.loansApi.list(), this.api);
});

When("I list loans with query {string}", async function (this: PlaywrightWorld, query: string) {
  await capture(await this.loansApi.list(query), this.api);
});

When("I get loan {string}", async function (this: PlaywrightWorld, id: string) {
  await capture(await this.loansApi.getById(id), this.api);
});

When("I create a loan:", async function (this: PlaywrightWorld, body: string) {
  await capture(await this.loansApi.create(body.trim()), this.api);
});

When("I call {word} {string}", async function (this: PlaywrightWorld, method: string, pathname: string) {
  await capture(await this.loansApi.call(method, pathname), this.api);
});

Then("the response status is {int}", async function (this: PlaywrightWorld, status: number) {
  expectStatus(this.api, status);
});

Then("the error code is {string}", async function (this: PlaywrightWorld, code: string) {
  expectError(this.api, this.api.status, code, errorField(this.api));
});

Then("the error field is {string}", async function (this: PlaywrightWorld, field: string) {
  expectError(this.api, this.api.status, errorCode(this.api), field);
});

Then("the error message is {string}", async function (this: PlaywrightWorld, message: string) {
  expect((this.api.body as { error: { message: string } }).error.message).toBe(message);
});

Then("the response is a loan page", async function (this: PlaywrightWorld) {
  const page = asLoanPage(this.api);
  expect(page.data.length).toBeLessThanOrEqual(page.meta.limit);
  if (page.meta.page > page.meta.totalPages) {
    expect(page.data).toEqual([]);
  }
});

Then("the page meta is page {int} and limit {int}", async function (this: PlaywrightWorld, page: number, limit: number) {
  const body = asLoanPage(this.api);
  expect(body.meta.page).toBe(page);
  expect(body.meta.limit).toBe(limit);
});

Then("the page contains {int} loans", async function (this: PlaywrightWorld, count: number) {
  expect(asLoanPage(this.api).data).toHaveLength(count);
});

Then("the loan total is {int}", async function (this: PlaywrightWorld, total: number) {
  expect(asLoanPage(this.api).meta.total).toBe(total);
});

Then("the loan total is at least {int}", async function (this: PlaywrightWorld, total: number) {
  expect(asLoanPage(this.api).meta.total).toBeGreaterThanOrEqual(total);
});

Then("every returned loan has type {string}", async function (this: PlaywrightWorld, type: string) {
  const expected = type.toLowerCase();
  expect(asLoanPage(this.api).data.every((loan) => loan.type === expected)).toBe(true);
});

Then("the returned loans include every seeded {string} loan", async function (this: PlaywrightWorld, type: string) {
  const expectedType = type.toLowerCase() as Loan["type"];
  const returned = asLoanPage(this.api).data;
  for (const loan of seedLoansOfType(expectedType)) {
    expect(returned).toContainEqual(loan);
  }
});

Then("the returned loans are sorted by {string} {string}", async function (this: PlaywrightWorld, field: string, order: string) {
  expectSorted(asLoanPage(this.api).data, field, order);
});

Then("the result includes {string}", async function (this: PlaywrightWorld, name: string) {
  expect(asLoanPage(this.api).data.some((loan) => loan.name === name)).toBe(true);
});

Then("the result does not include {string}", async function (this: PlaywrightWorld, name: string) {
  expect(asLoanPage(this.api).data.some((loan) => loan.name === name)).toBe(false);
});

Then("every returned amount is between {int} and {int}", async function (this: PlaywrightWorld, min: number, max: number) {
  for (const loan of asLoanPage(this.api).data) {
    expect(loan.amount).toBeGreaterThanOrEqual(min);
    expect(loan.amount).toBeLessThanOrEqual(max);
  }
});

Then("the loan matches seeded loan {int}", async function (this: PlaywrightWorld, id: number) {
  expect(asLoan(this.api)).toEqual(seedLoan(id));
});

Then("the returned loan amounts are {string}", async function (this: PlaywrightWorld, amounts: string) {
  const actual = asLoanPage(this.api).data.map((loan) => loan.amount);
  expect(actual).toEqual(amounts.split(",").map((value) => Number(value)));
});

Then("the created loan is persisted", async function (this: PlaywrightWorld) {
  const created = asLoan(this.api);
  expect(created.id).toBeGreaterThan(18);
  const saved = { status: 0, contentType: "", body: undefined as unknown };
  await capture(await this.loansApi.getById(created.id), saved);
  expectStatus(saved, 200);
  expect(asLoan(saved)).toEqual(created);
});

Then("loan pages {int} and {int} with limit {int} do not overlap", async function (this: PlaywrightWorld, first: number, second: number, limit: number) {
  const pageOne = { status: 0, contentType: "", body: undefined as unknown };
  const pageTwo = { status: 0, contentType: "", body: undefined as unknown };
  await capture(await this.loansApi.list(`page=${first}&limit=${limit}`), pageOne);
  await capture(await this.loansApi.list(`page=${second}&limit=${limit}`), pageTwo);
  expectStatus(pageOne, 200);
  expectStatus(pageTwo, 200);
  const firstIds = asLoanPage(pageOne).data.map((loan) => loan.id);
  const secondIds = asLoanPage(pageTwo).data.map((loan) => loan.id);
  expect(firstIds).toHaveLength(limit);
  expect(secondIds).toHaveLength(limit);
  expect(firstIds.filter((id) => secondIds.includes(id))).toEqual([]);
});

function errorCode(result: { body: unknown }): string {
  return (result.body as { error: { code: string } }).error.code;
}

function errorField(result: { body: unknown }): string {
  const field = (result.body as { error: { field?: string } }).error.field;
  return field ?? "none";
}
