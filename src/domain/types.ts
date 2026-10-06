export const LOAN_TYPES = ["home", "personal", "car"] as const;

export type LoanType = (typeof LOAN_TYPES)[number];

export interface Loan {
  id: number;
  name: string;
  lender: string;
  type: LoanType;
  amount: number;
  annualInterestRate: number;
  tenureMonths: number;
  city: string;
}

export interface Repayment {
  loanId: number;
  year: number;
  month: number;
  principalComponent: number;
  interestComponent: number;
  emi: number;
  balance: number;
}
