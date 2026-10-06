@ui
Feature: EMI bar chart

  Scenario: Personal loan of 10L at 12% for 5 years
    Given I launch the EMI calculator
    When I navigate to the Personal Loan tab
    And I set the Personal Loan Amount slider to 1000000
    And I set the Interest Rate slider to 12
    And I set the Loan Tenure slider to 5
    And I modify the schedule month to "Jan 2027"
    Then the bar chart is visible
    And the bar chart contains 10 bars
    And the tooltip of a bar matches the schedule for 1000000 at 12 percent for 5 years starting "Jan 2027"
