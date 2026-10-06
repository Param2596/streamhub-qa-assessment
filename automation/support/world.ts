import { World, setWorldConstructor, type IWorldOptions } from "@cucumber/cucumber";
import type { APIRequestContext, Browser, BrowserContext, Page } from "@playwright/test";
import { EmiCalculatorPage } from "../pages/emi-calculator.page";
import { LoansApi } from "../pages/loans.api";
import { RepaymentsApi } from "../pages/repayments.api";
import type { ApiResult } from "./types";

export class PlaywrightWorld extends World {
  api: ApiResult = { status: 0, contentType: "", body: undefined };
  request?: APIRequestContext;
  loansApi!: LoansApi;
  repaymentsApi!: RepaymentsApi;
  browser?: Browser;
  context?: BrowserContext;
  page!: Page;
  emiPage!: EmiCalculatorPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);
