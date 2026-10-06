@api
Feature: Loan catalog API

  The loan endpoints are configured from the test base URL. These scenarios
  cover each list parameter, the item endpoint, and invalid parameters.

  Scenario: list loans with default pagination and sort
    When I list loans
    Then the response status is 200
    And the response is a loan page
    And the page meta is page 1 and limit 10
    And the page contains 10 loans
    And the loan total is at least 18
    And the returned loans are sorted by "name" "asc"

  Scenario Outline: filter loans by type
    When I list loans with query "type=<type>&limit=50"
    Then the response status is 200
    And every returned loan has type "<type>"
    And the returned loans include every seeded "<expected>" loan
    And the loan total is <total>

    Examples:
      | type     | expected | total |
      | home     | home     | 6     |
      | personal | personal | 6     |
      | car      | car      | 6     |
      | HOME     | home     | 6     |

  Scenario Outline: search loans by name or lender
    When I list loans with query "<query>&limit=50"
    Then the response status is 200
    And the loan total is <total>
    And the result includes "<included>"
    And the result does not include "<excluded>"

    Examples:
      | query        | total | included         | excluded          |
      | q=north      | 2     | City Home 10Y    | Metro Home 15Y    |
      | q=NORTH      | 2     | Flex Personal 3Y | City Hatch 5Y     |
      | q=City Home  | 1     | City Home 10Y    | City Hatch 5Y     |

  Scenario: an unknown search returns an empty page
    When I list loans with query "q=zzzz-none"
    Then the response status is 200
    And the loan total is 0

  Scenario: a search string is matched literally
    When I list loans with query "q=' OR 1=1"
    Then the response status is 200
    And the loan total is 0

  Scenario Outline: filter loans by amount
    When I list loans with query "<query>&limit=50"
    Then the response status is 200
    And the loan total is <total>
    And every returned amount is between <min> and <max>
    And the result includes "<included>"
    And the result does not include "<excluded>"

    Examples:
      | query                                      | total | min     | max      | included          | excluded          |
      | minAmount=7500000                          | 1     | 7500000 | 7500000  | Estate Home 12Y   | Metro Home 15Y    |
      | maxAmount=100000                           | 1     | 100000  | 100000   | Quick Personal 1Y | Compact 2Y        |
      | minAmount=500000&maxAmount=1500000         | 8     | 500000  | 1500000  | Suburb Home 10Y   | Estate Home 12Y   |

  Scenario Outline: sort loans by each allowed field and direction
    When I list loans with query "type=home&sort=<field>&order=<order>&limit=50"
    Then the response status is 200
    And the loan total is 6
    And the returned loans are sorted by "<field>" "<order>"

    Examples:
      | field               | order |
      | name                | asc   |
      | name                | desc  |
      | amount              | asc   |
      | amount              | desc  |
      | annualInterestRate  | asc   |
      | annualInterestRate  | desc  |
      | tenureMonths        | asc   |
      | tenureMonths        | desc  |
      | lender              | asc   |
      | lender              | desc  |

  Scenario: order is case insensitive
    When I list loans with query "type=car&sort=amount&order=DESC&limit=50"
    Then the response status is 200
    And the returned loans are sorted by "amount" "desc"

  Scenario: combine type, sort, and pagination
    When I list loans with query "type=home&sort=amount&order=desc&page=1&limit=5"
    Then the response status is 200
    And the page meta is page 1 and limit 5
    And the page contains 5 loans
    And the returned loan amounts are "7500000,5000000,2500000,1500000,800000"

  Scenario: combine search and type
    When I list loans with query "q=harbor&type=home&limit=50"
    Then the response status is 200
    And the loan total is 1
    And the result includes "Metro Home 15Y"
    And every returned loan has type "home"

  Scenario: page through the catalog without repeating loans
    Then loan pages 1 and 2 with limit 5 do not overlap

  Scenario: a page past the end is empty
    When I list loans with query "page=100000&limit=10"
    Then the response status is 200
    And the response is a loan page
    And the page meta is page 100000 and limit 10
    And the page contains 0 loans
    And the loan total is at least 18

  Scenario Outline: fetch a seeded loan
    When I get loan "<id>"
    Then the response status is 200
    And the loan matches seeded loan <id>

    Examples:
      | id |
      | 1  |
      | 2  |
      | 18 |

  Scenario Outline: reject invalid loan list parameters
    When I list loans with query "<query>"
    Then the response status is 400
    And the error code is "<code>"
    And the error field is "<field>"

    Examples:
      | query                                              | code                  | field     |
      | page=0                                             | INVALID_PARAMETER     | page      |
      | page=-1                                            | INVALID_PARAMETER     | page      |
      | page=1.5                                           | INVALID_PARAMETER     | page      |
      | page=abc                                           | INVALID_PARAMETER     | page      |
      | page=1000001                                       | INVALID_PARAMETER     | page      |
      | limit=0                                            | INVALID_PARAMETER     | limit     |
      | limit=-1                                           | INVALID_PARAMETER     | limit     |
      | limit=51                                           | INVALID_PARAMETER     | limit     |
      | limit=10.5                                         | INVALID_PARAMETER     | limit     |
      | limit=ten                                          | INVALID_PARAMETER     | limit     |
      | sort=                                              | INVALID_PARAMETER     | sort      |
      | sort=city                                          | INVALID_PARAMETER     | sort      |
      | order=sideways                                     | INVALID_PARAMETER     | order     |
      | order=ascending                                    | INVALID_PARAMETER     | order     |
      | type=crypto                                        | INVALID_PARAMETER     | type      |
      | type=                                              | INVALID_PARAMETER     | type      |
      | minAmount=abc                                      | INVALID_PARAMETER     | minAmount |
      | minAmount=-1                                       | INVALID_PARAMETER     | minAmount |
      | minAmount=5000000&maxAmount=1000                   | INVALID_PARAMETER     | minAmount |
      | q=                                                 | INVALID_PARAMETER     | q         |
      | q=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | INVALID_PARAMETER | q |
      | foo=1                                              | UNEXPECTED_PARAMETER  | foo       |
      | type=home&type=car                                 | INVALID_PARAMETER     | type      |

  Scenario: limit 51 explains the allowed range
    When I list loans with query "limit=51"
    Then the response status is 400
    And the error message is "limit must be an integer between 1 and 50"

  Scenario Outline: reject invalid loan ids
    When I get loan "<id>"
    Then the response status is <status>
    And the error code is "<code>"
    And the error field is "<field>"

    Examples:
      | id    | status | code              | field |
      | 0     | 400    | INVALID_PARAMETER | id    |
      | -3    | 400    | INVALID_PARAMETER | id    |
      | 1.2   | 400    | INVALID_PARAMETER | id    |
      | abc   | 400    | INVALID_PARAMETER | id    |
      | 99999 | 404    | NOT_FOUND         | none  |

  Scenario: reject an unexpected parameter on a single loan
    When I call GET "/api/v1/loans/1?foo=1"
    Then the response status is 400
    And the error code is "UNEXPECTED_PARAMETER"
    And the error field is "foo"

  Scenario Outline: reject unsupported methods
    When I call <method> "<path>"
    Then the response status is <status>
    And the error code is "<code>"
    And the error field is "none"

    Examples:
      | method | path             | status | code               |
      | PUT    | /api/v1/loans    | 405    | METHOD_NOT_ALLOWED |
      | DELETE | /api/v1/loans/1  | 405    | METHOD_NOT_ALLOWED |
      | POST   | /api/v1/loans/1  | 405    | METHOD_NOT_ALLOWED |
      | GET    | /api/v1/nope     | 404    | NOT_FOUND          |
