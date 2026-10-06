export interface Loan {
  id: number;
  name: string;
  lender: string;
  type: "home" | "personal" | "car";
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

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface ApiResult {
  status: number;
  contentType: string;
  body: unknown;
}
