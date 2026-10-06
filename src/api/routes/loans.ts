import type { Request, Response } from "express";
import { ApiError } from "../errors";
import { paginate, selectLoans } from "../catalog";
import { createLoan, loadLoans } from "../store";
import {
  parseCreateLoanBody,
  parseLoanItemQuery,
  parseLoanListQuery,
  parseResourceId,
} from "../validate";

export function listLoans(req: Request, res: Response): void {
  const query = parseLoanListQuery(req.query as Record<string, unknown>);
  const loans = selectLoans(loadLoans(), query);
  res.json(paginate(loans, query.page, query.limit));
}

export function getLoan(req: Request, res: Response): void {
  parseLoanItemQuery(req.query as Record<string, unknown>);
  const id = parseResourceId(req.params.id);
  const loan = loadLoans().find((item) => item.id === id);
  if (!loan) {
    throw new ApiError(404, "NOT_FOUND", "Loan not found");
  }
  res.json(loan);
}

export function createLoanHandler(req: Request, res: Response): void {
  parseLoanItemQuery(req.query as Record<string, unknown>);
  const body = parseCreateLoanBody(req.body);
  const loan = createLoan(body);
  res.status(201).json(loan);
}
