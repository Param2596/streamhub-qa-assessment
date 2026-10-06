import fs from "fs";
import path from "path";
import { projectRoot } from "../../config/paths";
import { buildSchedule } from "../domain/emi";
import type { Loan, Repayment } from "../domain/types";
import {
  assertScheduleCoverage,
  type CreateLoanBody,
  loansFileSchema,
  parseDataFile,
  repaymentsFileSchema,
} from "./schemas";

let loansCache: Loan[] | undefined;
let repaymentsCache: Repayment[] | undefined;

function dataDir(): string {
  return path.join(projectRoot(), "src", "api", "data");
}

function readJson(filename: string): unknown {
  const filePath = path.join(dataDir(), filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing data file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
}

function ensureLoansLoaded(): Loan[] {
  if (!loansCache) {
    loansCache = parseDataFile(loansFileSchema, readJson("loans.json"), "loans.json");
  }
  return loansCache;
}

function ensureRepaymentsLoaded(): Repayment[] {
  if (!repaymentsCache) {
    const loans = ensureLoansLoaded();
    const rows = parseDataFile(repaymentsFileSchema, readJson("repayments.json"), "repayments.json");
    assertScheduleCoverage(loans, rows);
    repaymentsCache = rows;
  }
  return repaymentsCache;
}

export function loadLoans(): Loan[] {
  return ensureLoansLoaded().slice();
}

export function loadRepayments(): Repayment[] {
  return ensureRepaymentsLoaded().slice();
}

/** Creates a loan in memory and generates its repayment schedule. Resets on server restart. */
export function createLoan(body: CreateLoanBody): Loan {
  const loans = ensureLoansLoaded();
  const repayments = ensureRepaymentsLoaded();
  const nextId = loans.reduce((max, loan) => Math.max(max, loan.id), 0) + 1;
  const loan: Loan = { id: nextId, ...body };
  loans.push(loan);
  repayments.push(...buildSchedule(loan));
  return loan;
}
