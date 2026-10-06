import type { Loan } from "../domain/types";
import type { LoanListQuery, LoanSortField } from "./validate";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export function paginate<T>(items: readonly T[], page: number, limit: number): Page<T> {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = start >= total ? [] : items.slice(start, start + limit);
  return { data, meta: { page, limit, total, totalPages } };
}

function compareValues(left: string | number, right: string | number): number {
  if (typeof left === "string" && typeof right === "string") {
    return left.localeCompare(right, "en");
  }
  return Number(left) - Number(right);
}

function compareLoans(left: Loan, right: Loan, sort: LoanSortField, order: "asc" | "desc"): number {
  const comparison = compareValues(left[sort], right[sort]);
  if (comparison === 0) {
    return left.id - right.id;
  }
  return order === "asc" ? comparison : -comparison;
}

export function selectLoans(loans: readonly Loan[], query: LoanListQuery): Loan[] {
  const needle = query.q?.toLowerCase();
  const selected = loans.filter((loan) => {
    if (query.type !== undefined && loan.type !== query.type) {
      return false;
    }
    if (needle !== undefined && !loan.name.toLowerCase().includes(needle) && !loan.lender.toLowerCase().includes(needle)) {
      return false;
    }
    if (query.minAmount !== undefined && loan.amount < query.minAmount) {
      return false;
    }
    if (query.maxAmount !== undefined && loan.amount > query.maxAmount) {
      return false;
    }
    return true;
  });

  return selected.sort((left, right) => compareLoans(left, right, query.sort, query.order));
}
