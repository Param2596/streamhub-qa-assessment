import type { LoanType } from "../domain/types";
import { LOAN_TYPES } from "../domain/types";
import { z } from "zod";
import { env } from "../../config/env";
import { ApiError } from "./errors";
import { createLoanBodySchema, type CreateLoanBody } from "./schemas";

export const LOAN_SORT_FIELDS = ["name", "amount", "annualInterestRate", "tenureMonths", "lender"] as const;

export type LoanSortField = (typeof LOAN_SORT_FIELDS)[number];

const MAX_PAGE = 1_000_000;
const LOAN_QUERY_KEYS = ["type", "q", "minAmount", "maxAmount", "sort", "order", "page", "limit"];
const REPAYMENT_QUERY_KEYS = ["loanId", "year", "page", "limit"];

export interface LoanListQuery {
  type?: LoanType;
  q?: string;
  minAmount?: number;
  maxAmount?: number;
  sort: LoanSortField;
  order: "asc" | "desc";
  page: number;
  limit: number;
}

export interface RepaymentListQuery {
  loanId: number;
  year?: number;
  page: number;
  limit: number;
}

export function readQuery(query: Record<string, unknown>, allowed: readonly string[]): Record<string, string> {
  const unexpected = Object.keys(query).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    const field = unexpected[0];
    throw new ApiError(400, "UNEXPECTED_PARAMETER", `Unexpected parameter: ${field}`, field);
  }

  const normalized: Record<string, string> = {};
  for (const key of allowed) {
    if (!(key in query)) {
      continue;
    }
    const value = query[key];
    if (typeof value !== "string") {
      throw new ApiError(400, "INVALID_PARAMETER", `${key} must be a single value`, key);
    }
    normalized[key] = value;
  }
  return normalized;
}

function parseWith<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const issue = result.error.issues[0];
  const field = issue?.path.find((part) => typeof part === "string");
  throw new ApiError(
    400,
    "INVALID_PARAMETER",
    issue?.message ?? "Invalid parameter",
    typeof field === "string" ? field : undefined,
  );
}

function pageSchema() {
  return z
    .string()
    .superRefine((value, ctx) => {
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "page must be an integer greater than or equal to 1",
        });
        return;
      }
      if (Number(value) > MAX_PAGE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "page is out of range",
        });
      }
    })
    .transform((value) => Number(value));
}

function limitSchema(maxLimit: number) {
  const message = `limit must be an integer between 1 and ${maxLimit}`;
  return z
    .string()
    .superRefine((value, ctx) => {
      const parsed = Number(value);
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < 1 || parsed > maxLimit) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    })
    .transform((value) => Number(value));
}

function amountSchema(field: "minAmount" | "maxAmount") {
  return z
    .string()
    .regex(/^\d+(\.\d+)?$/, `${field} must be a number greater than or equal to 0`)
    .transform((value) => Number(value));
}

const typeSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (!LOAN_TYPES.includes(value.toLowerCase() as LoanType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "type must be one of home, personal, car",
      });
    }
  })
  .transform((value) => value.toLowerCase() as LoanType);

const sortSchema = z.enum(LOAN_SORT_FIELDS, {
  errorMap: () => ({
    message: "sort must be one of name, amount, annualInterestRate, tenureMonths, lender",
  }),
});

const orderSchema = z
  .string()
  .superRefine((value, ctx) => {
    const normalized = value.toLowerCase();
    if (normalized !== "asc" && normalized !== "desc") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "order must be asc or desc",
      });
    }
  })
  .transform((value) => value.toLowerCase() as "asc" | "desc");

const searchSchema = z.string().min(1, "q must be a non-empty string").max(100, "q must be at most 100 characters");

const yearSchema = z
  .string()
  .regex(/^\d{4}$/, "year must be a 4-digit year")
  .transform((value) => Number(value));

function positiveIntSchema(message: string) {
  return z
    .string()
    .superRefine((value, ctx) => {
      const parsed = Number(value);
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    })
    .transform((value) => Number(value));
}

function loanListSchema() {
  return z
    .object({
      type: typeSchema.optional(),
      q: searchSchema.optional(),
      minAmount: amountSchema("minAmount").optional(),
      maxAmount: amountSchema("maxAmount").optional(),
      sort: sortSchema.optional(),
      order: orderSchema.optional(),
      page: pageSchema().optional(),
      limit: limitSchema(env.maxLimit).optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (
        value.minAmount !== undefined &&
        value.maxAmount !== undefined &&
        value.minAmount > value.maxAmount
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "minAmount must be less than or equal to maxAmount",
          path: ["minAmount"],
        });
      }
    })
    .transform((value) => ({
      ...value,
      sort: value.sort ?? "name",
      order: value.order ?? "asc",
      page: value.page ?? env.defaultPage,
      limit: value.limit ?? env.defaultLimit,
    }));
}

function repaymentListSchema() {
  return z
    .object({
      loanId: z
        .string({ required_error: "loanId is required" })
        .superRefine((value, ctx) => {
          const parsed = Number(value);
          if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "loanId must be a positive integer",
            });
          }
        })
        .transform((value) => Number(value)),
      year: yearSchema.optional(),
      page: pageSchema().optional(),
      limit: limitSchema(env.maxLimit).optional(),
    })
    .transform((value) => ({
      ...value,
      page: value.page ?? env.defaultPage,
      limit: value.limit ?? env.defaultLimit,
    }));
}

export function parseLoanListQuery(query: Record<string, unknown>): LoanListQuery {
  return parseWith(loanListSchema(), readQuery(query, LOAN_QUERY_KEYS));
}

export function parseLoanItemQuery(query: Record<string, unknown>): void {
  readQuery(query, []);
}

export function parseRepaymentQuery(query: Record<string, unknown>): RepaymentListQuery {
  return parseWith(repaymentListSchema(), readQuery(query, REPAYMENT_QUERY_KEYS));
}

export function parseResourceId(raw: string | string[] | undefined): number {
  return parseWith(
    z.object({
      id: positiveIntSchema("id must be a positive integer"),
    }),
    { id: typeof raw === "string" ? raw : "" },
  ).id;
}

export function parseCreateLoanBody(body: unknown): CreateLoanBody {
  if (body === null || body === undefined || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "INVALID_PARAMETER", "Request body must be a JSON object");
  }

  const result = createLoanBodySchema.safeParse(body);
  if (result.success) {
    return result.data;
  }

  const issue = result.error.issues[0];
  const unrecognized = issue && "keys" in issue ? issue.keys[0] : undefined;
  const pathField = issue?.path.find((part) => typeof part === "string");
  const field = pathField ?? unrecognized;
  throw new ApiError(
    400,
    "INVALID_PARAMETER",
    issue?.message ?? "Invalid request body",
    typeof field === "string" ? field : undefined,
  );
}
