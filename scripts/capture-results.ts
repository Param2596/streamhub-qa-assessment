import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { chromium, type Page } from "playwright";

const root = process.cwd();
const outDir = path.join(root, "reports", "screenshots");

const reports = [
  { file: "api-cucumber.html", image: "b2-api-report-summary.png" },
  { file: "ui-cucumber.html", image: "b3-ui-report-summary.png" },
  { file: "self-healing-cucumber.html", image: "self-healing-report-summary.png" },
];

async function captureReport(page: Page, file: string, image: string): Promise<void> {
  const reportPath = path.join(root, "reports", file);
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Missing ${file}. Run the matching npm test script first.`);
  }
  await page.goto(pathToFileURL(reportPath).href);
  await page.waitForLoadState("networkidle");
  await page.getByRole("heading").first().waitFor();
  await page.screenshot({ path: path.join(outDir, image), clip: { x: 0, y: 0, width: 1280, height: 320 } });
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    for (const report of reports) {
      await captureReport(page, report.file, report.image);
    }
  } finally {
    await browser.close();
  }
  console.log(`Wrote report summaries to ${outDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
