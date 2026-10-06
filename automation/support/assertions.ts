import { expect } from "@playwright/test";
import type { ApiErrorBody, ApiResult, Loan, Page, PageMeta, Repayment } from "./types";

const LOAN_KEYS = [
  "id",
  "name",
  "lender",
  "type",
  "amount",
  "annualInterestRate",
  "tenureMonths",
  "city",
];

const REPAYMENT_KEYS = [
  "loanId",
  "year",
  "month",
  "principalComponent",
  "interestComponent",
  "emi",
  "balance",
];

export function expectJson(result: ApiResult): void {
  expect(result.contentType).toContain("application/json");
}

export function expectStatus(result: ApiResult, status: number): void {
  expect(result.status, JSON.stringify(result.body)).toBe(status);
  expectJson(result);
}

export function expectError(result: ApiResult, status: number, code: string, field: string): void {
  expectStatus(result, status);
  const body = result.body as ApiErrorBody;
  expect(body.error.code).toBe(code);
  expect(body.error.message.length).toBeGreaterThan(0);
  if (field === "none") {
    expect(body.error.field).toBeUndefined();
  } else {
    expect(body.error.field).toBe(field);
  }
}

export function asLoanPage(result: ApiResult): Page<Loan> {
  const body = result.body as Page<Loan>;
  expect(Array.isArray(body.data)).toBe(true);
  expectPageMeta(body.meta);
  for (const loan of body.data) {
    expect(Object.keys(loan).sort()).toEqual([...LOAN_KEYS].sort());
  }
  return body;
}

export function asLoan(result: ApiResult): Loan {
  const loan = result.body as Loan;
  expect(Object.keys(loan).sort()).toEqual([...LOAN_KEYS].sort());
  return loan;
}

export function asRepaymentPage(result: ApiResult): Page<Repayment> {
  const body = result.body as Page<Repayment>;
  expect(Array.isArray(body.data)).toBe(true);
  expectPageMeta(body.meta);
  for (const row of body.data) {
    expect(Object.keys(row).sort()).toEqual([...REPAYMENT_KEYS].sort());
  }
  return body;
}

export function expectPageMeta(meta: PageMeta): void {
  expect(meta.page).toBeGreaterThanOrEqual(1);
  expect(meta.limit).toBeGreaterThanOrEqual(1);
  expect(meta.total).toBeGreaterThanOrEqual(0);
  const expectedPages = meta.total === 0 ? 0 : Math.ceil(meta.total / meta.limit);
  expect(meta.totalPages).toBe(expectedPages);
}

const SORT_FIELDS = ["name", "amount", "annualInterestRate", "tenureMonths", "lender"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function compareLoans(left: Loan, right: Loan, field: SortField, order: "asc" | "desc"): number {
  const comparison =
    typeof left[field] === "string"
      ? String(left[field]).localeCompare(String(right[field]), "en")
      : Number(left[field]) - Number(right[field]);
  if (comparison === 0) {
    return left.id - right.id;
  }
  return order === "asc" ? comparison : -comparison;
}

export function expectSorted(loans: Loan[], field: string, order: string): void {
  expect(SORT_FIELDS).toContain(field);
  expect(["asc", "desc"]).toContain(order);
  const sorted = [...loans].sort((left, right) =>
    compareLoans(left, right, field as SortField, order as "asc" | "desc"),
  );
  expect(loans.map((loan) => loan.id)).toEqual(sorted.map((loan) => loan.id));
}
