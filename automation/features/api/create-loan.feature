@api
Feature: Create a loan

  Scenario: create a loan and read it back
    When I create a loan:
      """
      {"name":"Bdd Personal 1Y","lender":"Example Lender","type":"personal","amount":250000,"annualInterestRate":14.5,"tenureMonths":24,"city":"Pune"}
      """
    Then the response status is 201
    And the created loan is persisted

  Scenario: the created loan has a generated schedule
    When I create a loan:
      """
      {"name":"Bdd Schedule 1Y","lender":"Example Lender","type":"personal","amount":120000,"annualInterestRate":12,"tenureMonths":12,"city":"Delhi"}
      """
    Then the response status is 201
    And the created schedule repays the new loan

  Scenario: reject a create body that omits name
    When I create a loan:
      """
      {"lender":"Example Lender","type":"personal","amount":250000,"annualInterestRate":14.5,"tenureMonths":24,"city":"Pune"}
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error field is "name"

  Scenario: reject a create body that omits amount
    When I create a loan:
      """
      {"name":"Missing Amount","lender":"Example Lender","type":"personal","annualInterestRate":14.5,"tenureMonths":24,"city":"Pune"}
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error field is "amount"

  Scenario: reject a create body with an unsupported type
    When I create a loan:
      """
      {"name":"Bad Type","lender":"Example Lender","type":"HOME","amount":250000,"annualInterestRate":14.5,"tenureMonths":24,"city":"Pune"}
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error field is "type"

  Scenario: reject a create body with a zero amount
    When I create a loan:
      """
      {"name":"Zero Amount","lender":"Example Lender","type":"personal","amount":0,"annualInterestRate":14.5,"tenureMonths":24,"city":"Pune"}
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error field is "amount"

  Scenario: reject a create body with a fractional tenure
    When I create a loan:
      """
      {"name":"Fractional Tenure","lender":"Example Lender","type":"personal","amount":250000,"annualInterestRate":14.5,"tenureMonths":1.5,"city":"Pune"}
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error field is "tenureMonths"

  Scenario: reject a create body that supplies an id
    When I create a loan:
      """
      {"id":99,"name":"Client Id","lender":"Example Lender","type":"personal","amount":250000,"annualInterestRate":14.5,"tenureMonths":24,"city":"Pune"}
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error field is "id"

  Scenario: reject an empty create body
    When I create a loan:
      """
      {}
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error field is "name"

  Scenario: reject a create body that is not an object
    When I create a loan:
      """
      []
      """
    Then the response status is 400
    And the error code is "INVALID_PARAMETER"
    And the error message is "Request body must be a JSON object"
    And the error field is "none"

  Scenario: reject malformed JSON
    When I create a loan:
      """
      {bad
      """
    Then the response status is 400
    And the error message is "Request body must be valid JSON"
    And the error field is "none"
