import { After, AfterAll, Before, BeforeAll, setDefaultTimeout, Status } from "@cucumber/cucumber";
import { chromium, request } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { env } from "../../config/env";
import { projectRoot } from "../../config/paths";
import { EmiCalculatorPage } from "../pages/emi-calculator.page";
import { LoansApi } from "../pages/loans.api";
import { RepaymentsApi } from "../pages/repayments.api";
import { PlaywrightWorld } from "./world";

setDefaultTimeout(90_000);

const apiBaseUrl = env.testApiBaseUrl;
let server: ChildProcess | undefined;
let serverLog = "";

function profiles(): string[] {
  return process.argv.flatMap((arg, index, argv) => (arg === "--profile" && argv[index + 1] ? [argv[index + 1]] : []));
}

function needsApiServer(): boolean {
  const named = profiles().filter((name) => name !== "default");
  return named.length === 0 || named.includes("api");
}

BeforeAll(async function () {
  if (!needsApiServer()) {
    return;
  }
  server = spawn(process.execPath, ["--import", "tsx", "src/api/server.ts"], {
    cwd: projectRoot(),
    env: { ...process.env, API_PORT: String(env.testApiPort), API_BASE_URL: apiBaseUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk: Buffer) => {
    serverLog += chunk.toString();
  });
  server.stderr?.on("data", (chunk: Buffer) => {
    serverLog += chunk.toString();
  });
  await waitUntilReady(`${apiBaseUrl}/api/v1/loans`);
});

AfterAll(async function () {
  if (server && server.exitCode === null) {
    server.kill();
  }
});

Before({ tags: "@api" }, async function (this: PlaywrightWorld) {
  this.request = await request.newContext({
    baseURL: apiBaseUrl,
    extraHTTPHeaders: { Accept: "application/json" },
  });
  this.loansApi = new LoansApi(this.request);
  this.repaymentsApi = new RepaymentsApi(this.request);
});

After({ tags: "@api" }, async function (this: PlaywrightWorld, { result }) {
  if (result?.status === Status.FAILED && this.api.body !== undefined) {
    this.attach(
      JSON.stringify({ status: this.api.status, contentType: this.api.contentType, body: this.api.body }, null, 2),
      { mediaType: "application/json", fileName: "api-response.json" },
    );
  }
  await this.request?.dispose();
});

Before({ tags: "@ui or @self-healing" }, async function (this: PlaywrightWorld) {
  this.browser = await chromium.launch();
  this.context = await this.browser.newContext({
    baseURL: env.emiBaseUrl,
    viewport: { width: 1440, height: 900 },
  });
  this.page = await this.context.newPage();
  this.emiPage = new EmiCalculatorPage(this.page);
});

After({ tags: "@ui or @self-healing" }, async function (this: PlaywrightWorld) {
  await this.context?.close();
  await this.browser?.close();
});

After({ tags: "@ui" }, async function (this: PlaywrightWorld, { pickle }) {
  if (this.page) {
    // Highcharts animates for about a second after a redraw; capture the settled chart.
    await this.page.waitForTimeout(1_500);
    const image = await this.page.screenshot();
    this.attach(image, { mediaType: "image/png", fileName: "page.png" });
    saveScreenshot(`b3-${slug(pickle.name)}`, image);
  }
});

After({ tags: "@self-healing" }, async function (this: PlaywrightWorld, { pickle, result }) {
  if (result?.status === Status.FAILED && this.page) {
    const image = await this.page.screenshot();
    this.attach(image, { mediaType: "image/png", fileName: "page.png" });
    saveScreenshot(`self-healing-${slug(pickle.name)}`, image);
  }
});

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function saveScreenshot(name: string, image: Buffer): void {
  const dir = path.join(projectRoot(), "reports", "screenshots");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.png`), image);
}

async function waitUntilReady(url: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  let last = "";
  while (Date.now() < deadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`Loan API exited with ${server.exitCode}\n${serverLog}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      last = String(response.status);
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Loan API did not start (${last})\n${serverLog}`);
}
