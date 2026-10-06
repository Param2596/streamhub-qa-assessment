import fs from "fs";
import path from "path";
import { projectRoot } from "../config/paths";
import { buildSchedule, SCHEDULE_START } from "../src/domain/emi";
import { loansFileSchema, parseDataFile, repaymentsFileSchema } from "../src/api/schemas";

const dataDir = path.join(projectRoot(), "src", "api", "data");
const loans = parseDataFile(
  loansFileSchema,
  JSON.parse(fs.readFileSync(path.join(dataDir, "loans.json"), "utf8")) as unknown,
  "loans.json",
);

const rows = loans.flatMap((loan) => buildSchedule(loan, SCHEDULE_START));
parseDataFile(repaymentsFileSchema, rows, "repayments.json");

const outPath = path.join(dataDir, "repayments.json");
fs.writeFileSync(outPath, JSON.stringify(rows, null, 2) + "\n");

const first = rows.find((row) => row.loanId === 1);
console.log(`Wrote ${rows.length} repayment rows to ${outPath}`);
console.log(`Loan 1 first EMI: ${first?.emi ?? "missing"}`);
