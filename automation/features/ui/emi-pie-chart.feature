@ui
Feature: EMI pie chart

  Scenario Outline: <scenario>
    Given I launch the EMI calculator
    When I navigate to the Home Loan tab
    And I enter a home loan of <principal> at <rate> percent for <years> years
    Then the displayed EMI figures match the calculation for <principal> at <rate> percent for <years> years
    And the pie chart is visible
    And both sections of the pie chart show a number greater than zero

    Examples:
      | scenario                                | principal | rate | years |
      | Scenario A: 25L at 10% for 10 years     | 2500000   | 10   | 10    |
      | Scenario B: 50L at 7.5% for 15 years    | 5000000   | 7.5  | 15    |
