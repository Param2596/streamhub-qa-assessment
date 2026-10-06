import type { Loan, Repayment } from "../domain/types";
import { LOAN_TYPES } from "../domain/types";
import { z } from "zod";

export const createLoanBodySchema = z
  .object({
    name: z.string({ required_error: "name is required" }).min(1, "name is required"),
    lender: z.string({ required_error: "lender is required" }).min(1, "lender is required"),
    type: z.enum(LOAN_TYPES, {
      errorMap: () => ({ message: "type must be one of home, personal, car" }),
    }),
    amount: z
      .number({ required_error: "amount is required", invalid_type_error: "amount must be a number" })
      .positive("amount must be greater than 0"),
    annualInterestRate: z
      .number({
        required_error: "annualInterestRate is required",
        invalid_type_error: "annualInterestRate must be a number",
      })
      .nonnegative("annualInterestRate must be greater than or equal to 0"),
    tenureMonths: z
      .number({
        required_error: "tenureMonths is required",
        invalid_type_error: "tenureMonths must be a number",
      })
      .int("tenureMonths must be an integer")
      .positive("tenureMonths must be greater than 0"),
    city: z.string({ required_error: "city is required" }).min(1, "city is required"),
  })
  .strict();

export type CreateLoanBody = z.infer<typeof createLoanBodySchema>;

export const loanSchema: z.ZodType<Loan> = createLoanBodySchema
  .extend({
    id: z.number().int().positive(),
  })
  .strict();

export const repaymentSchema: z.ZodType<Repayment> = z
  .object({
    loanId: z.number().int().positive(),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    principalComponent: z.number().nonnegative(),
    interestComponent: z.number().nonnegative(),
    emi: z.number().positive(),
    balance: z.number().nonnegative(),
  })
  .strict();

export const loansFileSchema = z.array(loanSchema).superRefine((loans, ctx) => {
  const ids = new Set<number>();
  for (const loan of loans) {
    if (ids.has(loan.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate loan id ${loan.id}`,
      });
    }
    ids.add(loan.id);
  }
});

export const repaymentsFileSchema = z.array(repaymentSchema);

export function assertScheduleCoverage(loans: Loan[], rows: Repayment[]): void {
  const loanIds = new Set(loans.map((loan) => loan.id));
  for (const row of rows) {
    if (!loanIds.has(row.loanId)) {
      throw new Error(`Repayment references unknown loan ${row.loanId}`);
    }
  }
  for (const loan of loans) {
    const count = rows.filter((row) => row.loanId === loan.id).length;
    if (count !== loan.tenureMonths) {
      throw new Error(`Loan ${loan.id} has ${count} repayments, expected ${loan.tenureMonths}`);
    }
  }
}

export function parseDataFile<T>(schema: z.ZodType<T>, value: unknown, filename: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Invalid ${filename}: ${issue?.message ?? "unknown schema error"}`);
  }
  return parsed.data;
}
