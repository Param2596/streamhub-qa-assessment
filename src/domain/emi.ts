import type { Loan, Repayment } from "./types";

/** Every stored schedule starts in this month so year filters stay stable. */
export const SCHEDULE_START = { year: 2026, month: 1 } as const;

export function monthlyRate(annualInterestRate: number): number {
  return annualInterestRate / 12 / 100;
}

/** E = P * r * (1 + r)^n / ((1 + r)^n - 1), where r = annual / 12 / 100. */
export function rawEmi(principal: number, annualInterestRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0) {
    throw new Error("tenureMonths must be positive");
  }
  const rate = monthlyRate(annualInterestRate);
  if (rate === 0) {
    return principal / tenureMonths;
  }
  const growth = (1 + rate) ** tenureMonths;
  return (principal * rate * growth) / (growth - 1);
}

export function rupeesFromPaise(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

export function buildSchedule(
  loan: Pick<Loan, "id" | "amount" | "annualInterestRate" | "tenureMonths">,
  start: { year: number; month: number } = SCHEDULE_START,
): Repayment[] {
  const rate = monthlyRate(loan.annualInterestRate);
  const monthCount = loan.tenureMonths;
  const emiPaise = Math.round(rawEmi(loan.amount, loan.annualInterestRate, monthCount) * 100);
  let balancePaise = Math.round(loan.amount * 100);
  let principalSum = 0;
  let year = start.year;
  let month = start.month;
  const rows: Repayment[] = [];

  for (let index = 0; index < monthCount; index += 1) {
    const interestPaise = Math.round(balancePaise * rate);
    let principalPaise = emiPaise - interestPaise;
    let paymentPaise = emiPaise;
    const isLast = index === monthCount - 1;

    if (isLast) {
      principalPaise = balancePaise;
      paymentPaise = principalPaise + interestPaise;
      balancePaise = 0;
    } else if (principalPaise > balancePaise) {
      throw new Error(`Loan ${loan.id} overpays before the final month`);
    } else {
      if (principalPaise < 0) {
        principalPaise = 0;
        paymentPaise = interestPaise;
      }
      balancePaise -= principalPaise;
    }

    principalSum += principalPaise;
    rows.push({
      loanId: loan.id,
      year,
      month,
      principalComponent: rupeesFromPaise(principalPaise),
      interestComponent: rupeesFromPaise(interestPaise),
      emi: rupeesFromPaise(paymentPaise),
      balance: rupeesFromPaise(balancePaise),
    });

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  if (balancePaise !== 0 || principalSum !== Math.round(loan.amount * 100)) {
    throw new Error(`Loan ${loan.id} schedule did not repay the principal exactly`);
  }

  return rows;
}
