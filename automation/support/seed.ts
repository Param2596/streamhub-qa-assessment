import fs from "fs";
import path from "path";
import type { Loan } from "./types";

export function loadSeedLoans(): Loan[] {
  const filePath = path.join(process.cwd(), "src", "api", "data", "loans.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Loan[];
}

export function seedLoan(id: number): Loan {
  const loan = loadSeedLoans().find((item) => item.id === id);
  if (!loan) {
    throw new Error(`Seed loan ${id} was not found`);
  }
  return loan;
}

export function seedLoansOfType(type: Loan["type"]): Loan[] {
  return loadSeedLoans().filter((loan) => loan.type === type);
}
