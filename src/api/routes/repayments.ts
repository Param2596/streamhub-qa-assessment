import type { Request, Response } from "express";
import { ApiError } from "../errors";
import { paginate } from "../catalog";
import { loadLoans, loadRepayments } from "../store";
import { parseRepaymentQuery } from "../validate";

export function listRepayments(req: Request, res: Response): void {
  const query = parseRepaymentQuery(req.query as Record<string, unknown>);
  const loan = loadLoans().find((item) => item.id === query.loanId);
  if (!loan) {
    throw new ApiError(404, "NOT_FOUND", "Loan not found");
  }

  const rows = loadRepayments().filter((row) => {
    if (row.loanId !== query.loanId) {
      return false;
    }
    if (query.year !== undefined && row.year !== query.year) {
      return false;
    }
    return true;
  });

  res.json(paginate(rows, query.page, query.limit));
}
