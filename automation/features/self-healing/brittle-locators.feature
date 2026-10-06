@self-healing
Feature: Brittle locators

  These locators are intentionally wrong. They stay broken so the self-healing
  exercise has real failures to detect. Do not replace them in this file.

  Scenario: positional input for the loan amount
    Given I launch the EMI calculator
    Then the positional loan amount field is visible

  Scenario: absolute path for the EMI figure
    Given I launch the EMI calculator
    Then the absolute EMI figure path is visible

  Scenario: positional pie slice
    Given I launch the EMI calculator
    When I navigate to the Home Loan tab
    Then the positional pie slice is visible

  Scenario: positional first bar
    Given I launch the EMI calculator
    When I navigate to the Personal Loan tab
    Then the positional first bar is visible

  Scenario: default EMI text after the amount changes
    Given I launch the EMI calculator
    When I navigate to the Home Loan tab
    And I enter a home loan of 2500000 at 10 percent for 10 years
    Then the untouched default EMI text is visible
