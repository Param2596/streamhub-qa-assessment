/** Standard reducing-balance EMI: E = P * r * (1 + r)^n / ((1 + r)^n - 1). */
export function calculateEmi(principal: number, annualRatePercent: number, years: number): {
  emi: number;
  totalInterest: number;
  totalPayment: number;
} {
  const monthlyRate = annualRatePercent / 12 / 100;
  const months = years * 12;
  const emi = (principal * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  const totalPayment = Math.round(emi * months);
  return {
    emi: Math.round(emi),
    totalInterest: totalPayment - principal,
    totalPayment,
  };
}

export function parseRupees(text: string): number {
  const match = text.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`No rupee amount found in: ${text}`);
  }
  return Number(match[1]);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseMonthYear(value: string): { year: number; month: number } {
  const [monthName, yearText] = value.trim().split(/\s+/);
  const month = MONTHS.indexOf(monthName) + 1;
  const year = Number(yearText);
  if (month === 0 || !Number.isInteger(year)) {
    throw new Error(`Cannot read a month and year from "${value}"`);
  }
  return { year, month };
}

export interface YearSlice {
  year: number;
  interest: number;
  principal: number;
  totalPayment: number;
}

/** Groups the monthly reducing-balance schedule into calendar years, rounded to the rupee. */
export function yearlySchedule(
  principal: number,
  annualRatePercent: number,
  years: number,
  start: { year: number; month: number },
): YearSlice[] {
  const monthlyRate = annualRatePercent / 12 / 100;
  const months = years * 12;
  const emi = (principal * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  let balance = principal;
  let year = start.year;
  let month = start.month;
  const buckets = new Map<number, { interest: number; principal: number }>();

  for (let index = 0; index < months; index += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = index === months - 1 ? balance : emi - interest;
    balance -= principalPaid;
    const bucket = buckets.get(year) ?? { interest: 0, principal: 0 };
    bucket.interest += interest;
    bucket.principal += principalPaid;
    buckets.set(year, bucket);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return [...buckets.entries()].map(([bucketYear, bucket]) => ({
    year: bucketYear,
    interest: Math.round(bucket.interest),
    principal: Math.round(bucket.principal),
    totalPayment: Math.round(bucket.interest + bucket.principal),
  }));
}

export interface BarTooltip {
  year: number;
  series: "Interest" | "Principal";
  amount: number;
  totalPayment: number;
}

export function parseBarTooltip(text: string): BarTooltip {
  const compact = text.replace(/\s+/g, " ");
  const year = Number(compact.match(/Year\s*:?\s*(\d{4})/i)?.[1]);
  const series = compact.match(/(Interest|Principal)\s*:/)?.[1];
  const amounts = [...compact.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g)].map((match) => parseRupees(match[1]));
  if (!Number.isInteger(year) || (series !== "Interest" && series !== "Principal") || amounts.length < 2) {
    throw new Error(`Tooltip did not contain a year, series, and two rupee amounts: ${compact}`);
  }
  return {
    year,
    series,
    amount: Math.round(amounts[0]),
    totalPayment: Math.round(amounts[1]),
  };
}
