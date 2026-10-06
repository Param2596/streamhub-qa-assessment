@api
Feature: Repayment schedule API

  Scenario: list a seeded schedule with default pagination
    When I list repayments with query "loanId=1"
    Then the response status is 200
    And the response is a repayment page
    And the repayment page meta is page 1 and limit 10
    And the repayment total is 120
    And the first repayment for loan 1 matches the amortized opening row

  Scenario: filter a schedule by year
    When I list repayments with query "loanId=1&year=2026&limit=50"
    Then the response status is 200
    And the repayment total is 12
    And the first repayment for loan 1 matches the amortized opening row

  Scenario: a valid year with no rows is an empty page
    When I list repayments with query "loanId=8&year=2030"
    Then the response status is 200
    And the response is a repayment page
    And the repayment total is 0

  Scenario: paginate a schedule
    When I list repayments with query "loanId=1&limit=50&page=3"
    Then the response status is 200
    And the repayment page meta is page 3 and limit 50
    And the repayment total is 120

  Scenario: a seeded schedule repays the principal exactly
    Then the full schedule for loan 1 repays the principal

  Scenario Outline: reject invalid repayment parameters
    When I list repayments with query "<query>"
    Then the response status is <status>
    And the error code is "<code>"
    And the error field is "<field>"

    Examples:
      | query            | status | code                  | field  |
      |                  | 400    | INVALID_PARAMETER     | loanId |
      | loanId=abc       | 400    | INVALID_PARAMETER     | loanId |
      | loanId=0         | 400    | INVALID_PARAMETER     | loanId |
      | loanId=-1        | 400    | INVALID_PARAMETER     | loanId |
      | loanId=99999     | 404    | NOT_FOUND             | none   |
      | loanId=1&year=20 | 400    | INVALID_PARAMETER     | year   |
      | loanId=1&year=2024.5 | 400 | INVALID_PARAMETER   | year   |
      | loanId=1&page=0  | 400    | INVALID_PARAMETER     | page   |
      | loanId=1&limit=51 | 400   | INVALID_PARAMETER     | limit  |
      | loanId=1&foo=1   | 400    | UNEXPECTED_PARAMETER  | foo    |

  Scenario: reject an unsupported method
    When I call POST "/api/v1/repayments"
    Then the response status is 405
    And the error code is "METHOD_NOT_ALLOWED"
    And the error field is "none"
