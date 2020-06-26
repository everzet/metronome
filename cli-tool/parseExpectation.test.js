const parseExpectaion = require("./parseExpectation");

test("returns null if invalid text is given", () => {
  expect(parseExpectaion("invalid_text", new Date())).toEqual({
    ok: false,
    error: "Parse error",
  });
});

test("extracts metric, direction, measure and deadline from text", () => {
  const string = "conversionRate +2% in 1 month";
  const fromDate = new Date("2020-06-26T10:46:19+01:00");

  const { expectation } = parseExpectaion(string, fromDate);

  expect(expectation).not.toBeNull();
  expect(expectation.metric).toBe("conversionRate");
  expect(expectation.direction).toBe("increase_by");
  expect(expectation.measure.value).toEqual(2.0);
  expect(expectation.measure.unit).toBe("percent");
  expect(expectation.fromDate).toEqual(fromDate);
  expect(expectation.deadline).toEqual(new Date("2020-07-26T11:00:00.000Z"));
});

test("complex string in a very natural language", () => {
  const string = "conversion will increase to 5.5 in three weeks from now";
  const fromDate = new Date("2020-06-26T10:46:19+01:00");

  const { expectation } = parseExpectaion(string, fromDate);

  expect(expectation).not.toBeNull();
  expect(expectation.metric).toBe("conversion");
  expect(expectation.direction).toBe("increase_to");
  expect(expectation.measure.value).toEqual(5.5);
  expect(expectation.measure.unit).toBe("number");
  expect(expectation.fromDate).toEqual(fromDate);
  expect(expectation.deadline).toEqual(new Date("2020-07-17:11:00.000Z"));
});

test("properly parses different direction variants", () => {
  const cases = [
    // Increase/Decrease by
    { text: "+", direction: "increase_by" },
    { text: "increase by", direction: "increase_by" },
    { text: "increases by", direction: "increase_by" },
    { text: "-", direction: "decrease_by" },
    { text: "decrease by", direction: "decrease_by" },
    { text: "decreases by", direction: "decrease_by" },

    // Increase/Decrease to
    { text: "increase to", direction: "increase_to" },
    { text: "increases to", direction: "increase_to" },
    { text: "decrease to", direction: "decrease_to" },
    { text: "decreases to", direction: "decrease_to" },

    // Become
    { text: "", direction: "become" },
    { text: "is", direction: "become" },
    { text: "to be", direction: "become" },
    { text: "become", direction: "become" },
    { text: "becomes", direction: "become" },

    // Maintain at
    { text: "~", direction: "maintain" },
    { text: "stay at", direction: "maintain" },
    { text: "stays at", direction: "maintain" },
    { text: "stay around", direction: "maintain" },
    { text: "stays around", direction: "maintain" },
  ];

  cases.forEach(({ text, direction }) => {
    const string = `conv ${text} 2% in 1 month`;
    const { expectation } = parseExpectaion(string, new Date());
    expect(expectation.direction).toBe(direction);
  });
});

test("properly parses different types of measures", () => {
  const cases = [
    { text: "2%", measure: { value: 2.0, unit: "percent" } },
    { text: "2.3%", measure: { value: 2.3, unit: "percent" } },
    { text: "2 %", measure: { value: 2.0, unit: "percent" } },
    { text: "2percent", measure: { value: 2.0, unit: "percent" } },
    { text: "2.3percent", measure: { value: 2.3, unit: "percent" } },
    { text: "2 percent", measure: { value: 2.0, unit: "percent" } },
    { text: "2", measure: { value: 2.0, unit: "number" } },
    { text: "2.3", measure: { value: 2.3, unit: "number" } },
    { text: "true", measure: { value: true, unit: "boolean" } },
    { text: "false", measure: { value: false, unit: "boolean" } },
    { text: '"str"', measure: { value: "str", unit: "string" } },
    { text: "'str'", measure: { value: "str", unit: "string" } },
  ];

  cases.forEach(({ text, measure }) => {
    const string = `conv becomes ${text} in 1 month`;
    const { expectation } = parseExpectaion(string, new Date());
    expect(expectation.measure).toEqual(measure);
  });
});

test("properly parses different types of timelines", () => {
  const fromDate = new Date("2020-06-26T10:46:19+01:00");
  const cases = [
    { text: "tomorrow", deadline: new Date("2020-06-27T11:00:00.000Z") },
    { text: "in 3 days", deadline: new Date("2020-06-29T11:00:00.000Z") },
    { text: "in a week", deadline: new Date("2020-07-03T11:00:00.000Z") },
    { text: "within a week", deadline: new Date("2020-07-03T11:00:00.000Z") },
    { text: "in under a week", deadline: new Date("2020-07-03T11:00:00.000Z") },
    { text: "in 2 weeks", deadline: new Date("2020-07-10T11:00:00.000Z") },
    {
      text: "within two weeks",
      deadline: new Date("2020-07-10T11:00:00.000Z"),
    },
    { text: "next month", deadline: new Date("2020-07-26T11:00:00.000Z") },
    { text: "in a month", deadline: new Date("2020-07-26T11:00:00.000Z") },
    {
      text: "in under a month",
      deadline: new Date("2020-07-26T11:00:00.000Z"),
    },
  ];

  cases.forEach(({ text, deadline }) => {
    const string = `conv becomes 2 ${text}`;
    const { expectation } = parseExpectaion(string, new Date());
    expect(expectation.deadline).toEqual(deadline);
  });
});

test("validates consistency of resulting expectation", () => {
  const cases = [
    { text: "c +5 never", err: "Some details failed parsing" },
    {
      text: "c increase by true tomorrow",
      err:
        "Booleans can only be used with 'maintain' or 'become' modifiers, but 'increase_by' was given",
    },
    {
      text: 'c increase to "Hello" tomorrow',
      err:
        "Strings can only be used with 'maintain' or 'become' modifiers, but 'increase_to' was given",
    },
    {
      text: "c increase to 5 last week",
      err: "Expectation deadlines can not be set in the past",
    },
  ];

  cases.forEach(({ text, err }) => {
    const { ok, expectation, error } = parseExpectaion(text, new Date());
    expect(ok).toBe(false);
    expect(error).toBe(err);
  });
});
