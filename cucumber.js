module.exports = {
  default: {
    paths: [
      "automation/features/api/loans.feature",
      "automation/features/api/repayments.feature",
      "automation/features/api/create-loan.feature",
      "automation/features/ui/emi-pie-chart.feature",
      "automation/features/ui/emi-bar-chart.feature",
      "automation/features/self-healing/brittle-locators.feature",
    ],
    require: ["automation/support/world.ts", "automation/support/hooks.ts", "automation/steps/**/*.ts"],
    requireModule: ["tsx/cjs"],
    format: ["progress"],
    order: "defined",
    publish: false,
    forceExit: true,
  },
  api: {
    tags: "@api",
    format: ["html:reports/api-cucumber.html", "summary"],
  },
  ui: {
    tags: "@ui",
    format: ["html:reports/ui-cucumber.html", "summary"],
  },
  "self-healing": {
    tags: "@self-healing",
    format: ["html:reports/self-healing-cucumber.html", "summary"],
  },
};
