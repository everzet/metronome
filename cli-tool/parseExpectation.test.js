const parseExpectaion = require("./parseExpectation");

test("returns null if invalid text is given", () => {
  expect(parseExpectaion("invalid_text", new Date())).toBeNull();
});

test("extracts metric, direction, measure and deadline from text", () => {
  const expectation = "conversionRate +2% in 1 month";
  const fromDate = new Date("2020-06-26T10:46:19+01:00");

  const parsed = parseExpectaion(expectation, fromDate);

  expect(parsed).not.toBeNull();
  expect(parsed.metric).toBe("conversionRate");
  expect(parsed.direction).toBe("increase_by");
  expect(parsed.measure.value).toEqual(2.0);
  expect(parsed.measure.unit).toBe("percent");
  expect(parsed.fromDate).toEqual(fromDate);
  expect(parsed.deadline).toEqual(new Date("2020-07-26T11:00:00.000Z"));
});

test("complex expectation in a very natural language", () => {
  const expectation = "conversion will increase to 5.5 in three weeks from now";
  const fromDate = new Date("2020-06-26T10:46:19+01:00");

  const parsed = parseExpectaion(expectation, fromDate);

  expect(parsed).not.toBeNull();
  expect(parsed.metric).toBe("conversion");
  expect(parsed.direction).toBe("increase_to");
  expect(parsed.measure.value).toEqual(5.5);
  expect(parsed.measure.unit).toBe("number");
  expect(parsed.fromDate).toEqual(fromDate);
  expect(parsed.deadline).toEqual(new Date("2020-07-17:11:00.000Z"));
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
    const expectation = `conv ${text} 2% in 1 month`;
    const parsed = parseExpectaion(expectation, new Date());
    expect(parsed.direction).toBe(direction);
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
  ];

  cases.forEach(({ text, measure }) => {
    const expectation = `conv becomes ${text} in 1 month`;
    const parsed = parseExpectaion(expectation, new Date());
    expect(parsed.measure).toEqual(measure);
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
    const expectation = `conv becomes 2 ${text}`;
    const parsed = parseExpectaion(expectation, new Date());
    expect(parsed.deadline).toEqual(deadline);
  });
});
