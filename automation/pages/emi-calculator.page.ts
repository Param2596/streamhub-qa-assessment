import { expect, type Locator, type Page } from "@playwright/test";
import { parseRupees } from "../support/emi";

export class EmiCalculatorPage {
  private captureBarChart = false;

  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await expect(async () => {
      await this.page.goto("/", { timeout: 30_000 });
    }).toPass({ timeout: 90_000 });
  }

  async openHomeLoan(): Promise<void> {
    await this.tab("Home Loan").click();
    await expect(this.page.getByRole("textbox", { name: "Home Loan Amount" })).toBeVisible();
  }

  async openPersonalLoan(): Promise<void> {
    await this.tab("Personal Loan").click();
    await expect(this.page.getByRole("textbox", { name: "Personal Loan Amount" })).toBeVisible();
  }

  // Google ad overlays add a role=link with the same aria-label and "." as text.
  private tab(name: string): Locator {
    return this.page.getByRole("link", { name, exact: true }).filter({ hasText: name });
  }

  async enterHomeLoan(principal: number, annualRatePercent: number, years: number): Promise<void> {
    await this.page.getByRole("radio", { name: "Yr" }).check();
    await this.replaceField("Home Loan Amount", String(principal));
    await this.replaceField("Interest Rate", String(annualRatePercent));
    await this.replaceField("Loan Tenure", String(years));
  }

  async setSlider(label: string, target: number): Promise<void> {
    const field = this.page.getByRole("textbox", { name: label, exact: true });
    await field.scrollIntoViewIfNeeded();
    const inputId = await field.getAttribute("id");
    if (!inputId) {
      throw new Error(`Could not find the input id for ${label}`);
    }
    // Remaining structural locator: the track id is always `${inputId}slider` on this
    // third-party page, and the handle is a jQuery UI widget with no accessible name.
    // Role/text cannot drive the drag without those plugin hooks.
    const slider = this.page.locator(`#${inputId}slider`);
    const handle = slider.locator(".ui-slider-handle");
    const { min, max } = await slider.evaluate((element) => {
      const options = (window as unknown as { jQuery: (el: Element) => { slider: (cmd: string) => { min: number; max: number } } }).jQuery(element).slider("option");
      return { min: options.min, max: options.max };
    });

    const track = await slider.boundingBox();
    const knob = await handle.boundingBox();
    if (!track || !knob) {
      throw new Error(`Slider for ${label} is not visible`);
    }
    const ratio = max === min ? 0 : (target - min) / (max - min);
    const startX = knob.x + knob.width / 2;
    const startY = knob.y + knob.height / 2;
    const targetX = track.x + Math.min(1, Math.max(0, ratio)) * track.width;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, startY, { steps: 12 });
    await this.page.mouse.up();

    await handle.focus();
    for (let attempt = 0; attempt < 30 && (await this.fieldNumber(field)) !== target; attempt += 1) {
      const current = await this.fieldNumber(field);
      await handle.press(current < target ? "ArrowRight" : "ArrowLeft");
    }
    expect(await this.fieldNumber(field), `${label} slider`).toBe(target);
  }

  async changeScheduleMonth(target: string): Promise<void> {
    const field = this.page.getByRole("textbox", { name: "Schedule showing EMI payments starting from" });
    await field.scrollIntoViewIfNeeded();
    const [month, year] = target.split(" ");
    await field.click();
    const calendar = this.page.getByRole("table").filter({
      has: this.page.getByRole("columnheader", { name: "»", exact: true }),
    });
    await expect(calendar).toBeVisible();
    const yearLabel = calendar.getByRole("columnheader", { name: /^\d{4}$/ });
    for (let attempt = 0; attempt < 12 && (await yearLabel.innerText()).trim() !== year; attempt += 1) {
      const shown = Number((await yearLabel.innerText()).trim());
      const direction = shown < Number(year) ? "»" : "«";
      await calendar.getByRole("columnheader", { name: direction, exact: true }).click();
    }
    await calendar.getByText(month, { exact: true }).click();
    await expect(field).toHaveValue(target);
  }

  async emiFigures(): Promise<{ emi: number; totalInterest: number; totalPayment: number }> {
    return {
      emi: await this.amountUnder(/^Loan EMI$/),
      totalInterest: await this.amountUnder("Total Interest Payable"),
      totalPayment: await this.amountUnder(/Total Payment/),
    };
  }

  async expectPieChartVisible(): Promise<void> {
    await expect(this.pieChart()).toBeVisible();
  }

  async pieSectionValues(): Promise<number[]> {
    const chart = this.pieChart();
    await scrollIntoView(chart);
    const labels = await chart.getByText(/\d/).allTextContents();
    return labels.map((label) => Number(label.replace(/[^\d.]/g, ""))).filter((value) => Number.isFinite(value));
  }

  async expectBarChartVisible(): Promise<void> {
    this.captureBarChart = true;
    const chart = this.barChart();
    await scrollIntoView(chart);
    await expect(chart).toBeVisible();
  }

  async barCount(): Promise<number> {
    this.captureBarChart = true;
    const chart = this.barChart();
    await scrollIntoView(chart);
    // Remaining structural locator: Highcharts column bars are SVG rects with no
    // accessible name. Counting real payment bars needs the chart's series classes.
    return chart.locator(".highcharts-series rect.highcharts-point").evaluateAll((nodes) =>
      nodes.filter((node) => {
        const parentClass = node.parentElement?.getAttribute("class") ?? "";
        const height = Number(node.getAttribute("height") ?? "0");
        return height > 1 && parentClass.includes("highcharts-column-series") && !parentClass.includes("highcharts-legend");
      }).length,
    );
  }

  async barTooltipText(): Promise<string> {
    this.captureBarChart = true;
    let text = "";
    await expect(async () => {
      text = await this.hoverTallestBar();
    }).toPass({ timeout: 20_000 });
    return text;
  }

  async screenshot(): Promise<Buffer> {
    const chart = this.barChart();
    if (this.captureBarChart && (await chart.count()) > 0) {
      return chart.screenshot();
    }
    return this.page.screenshot();
  }

  private async hoverTallestBar(): Promise<string> {
    const chart = this.barChart();
    // Remaining structural locator: hover target + tooltip live in Highcharts SVG
    // internals (no role/name). Filter tallest column point, then read .highcharts-tooltip.
    const bar = await chart.evaluateHandle((root) => {
      const nodes = [...root.querySelectorAll(".highcharts-column-series .highcharts-point")];
      return nodes.reduce<Element | null>((tallest, node) => {
        const parentClass = node.parentElement?.getAttribute("class") ?? "";
        const height = Number(node.getAttribute("height") ?? "0");
        if (height <= 1 || !parentClass.includes("highcharts-column-series") || parentClass.includes("highcharts-legend")) {
          return tallest;
        }
        if (!tallest || height > Number(tallest.getAttribute("height") ?? "0")) {
          return node;
        }
        return tallest;
      }, null);
    });
    const point = bar.asElement();
    if (!point) {
      throw new Error("No payment bar was visible");
    }
    await point.hover({ timeout: 5_000 });
    const tooltip = chart.locator(".highcharts-tooltip");
    await expect
      .poll(async () => tooltip.evaluate((element) => element.textContent ?? ""), { timeout: 5_000 })
      .toMatch(/₹/);
    return tooltip.evaluate((element) => element.textContent ?? "");
  }

  private async replaceField(name: string, value: string): Promise<void> {
    const field = this.page.getByRole("textbox", { name, exact: true });
    await field.click();
    await field.fill(value);
    await field.press("Tab");
  }

  private pieChart(): Locator {
    return this.page.getByRole("img").filter({ hasText: "Break-up of Total Payment" });
  }

  private barChart(): Locator {
    return this.page.getByRole("img").filter({ hasText: "EMI Payment / year" });
  }

  private async fieldNumber(field: Locator): Promise<number> {
    return Number((await field.inputValue()).replace(/,/g, ""));
  }

  private async amountUnder(heading: string | RegExp): Promise<number> {
    const headingNode = this.page.getByRole("heading", { name: heading });
    const text = await headingNode.evaluate((element) => element.parentElement?.innerText ?? "");
    return parseRupees(text);
  }
}

// Highcharts redraws the chart after an input changes, which can detach the node mid-scroll.
async function scrollIntoView(locator: Locator): Promise<void> {
  await expect(async () => {
    await locator.scrollIntoViewIfNeeded({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}
