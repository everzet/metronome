const createTracker = require("./createTracker");

const expectationBaseline = {
  meter: "conversion",
  fromDate: new Date("2018-06-26T12:00:00.000Z"),
  deadline: new Date("2018-07-26T12:00:00.000Z"),
};

describe("any tracker", () => {
  const expectation = {
    ...expectationBaseline,
    direction: "increase_by",
    measure: { value: 5.0, unit: "percent" },
  };

  test("stores expectation", () => {
    const tracker = createTracker(expectation);
    expect(tracker.expectation).toBe(expectation);
  });

  test("records matching readings", () => {
    const tracker = createTracker(expectation);
    const reading1 = {
      meter: "conversion",
      value: 0.5,
      date: new Date("2018-06-27T12:00:00.000Z"),
    };
    const reading2 = {
      meter: "conversion",
      value: 0.5,
      date: new Date("2018-06-28T12:00:00.000Z"),
    };
    tracker.track([reading1]);
    tracker.track([reading2]);
    expect(tracker.trackedReadings()).toEqual([reading1, reading2]);
    expect(tracker.lastViewedReadingDate()).toEqual(
      new Date("2018-06-28T12:00:00.000Z")
    );
  });

  test("ignores the readings that are not relevant to the expectation", () => {
    const tracker = createTracker(expectation);
    tracker.track([{ meter: "someOtherMeter", value: 0.5, date: new Date() }]);
    expect(tracker.trackedReadings()).toEqual([]);
    expect(tracker.lastViewedReadingDate()).toEqual(null);
  });

  test("ignores matching readings after the deadline", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      {
        meter: "conversion",
        value: 0.9,
        date: new Date("2018-08-26T12:00:00.000Z"),
      },
    ]);
    expect(tracker.trackedReadings()).toEqual([]);
  });

  test("lastViewedReadingDate reflects readings outside of time range", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      {
        meter: "conversion",
        value: 0.9,
        date: new Date("2018-08-26T12:00:00.000Z"),
      },
    ]);
    expect(tracker.lastViewedReadingDate()).toEqual(
      new Date("2018-08-26T12:00:00.000Z")
    );
  });

  test("deadlineReached returns false when lastViewedReadingDate is null (no readings)", () => {
    const tracker = createTracker(expectation);
    expect(tracker.deadlineReached()).toBe(false);
  });

  test("deadlineReached returns false when all given readings were earlier than deadline", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      {
        meter: "conversion",
        value: 0.9,
        date: new Date("2018-07-24T12:00:00.000Z"),
      },
    ]);
    expect(tracker.deadlineReached()).toBe(false);
  });

  test("deadlineReached returns true if at least one reading was post deadline", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      {
        meter: "conversion",
        value: 0.9,
        date: new Date("2018-07-28T12:00:00.000Z"),
      },
    ]);
    expect(tracker.deadlineReached()).toBe(true);
  });
});

describe("increase_by tracker", () => {
  const expectation = {
    ...expectationBaseline,
    direction: "increase_by",
    measure: { value: 5.0, unit: "percent" },
  };

  test("hasMetExpectation returns false when there are no tracked readings", () => {
    const tracker = createTracker(expectation);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns false when there is just one tracked reading", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns false when there is no increase between readings", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 2.3, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns false when the increase does not match percent", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 2.4, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns true when the increase does match percent", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 2.416, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(true);
  });

  test("hasMetExpectation returns false when the increase does not match number", () => {
    const tracker = createTracker({
      ...expectation,
      measure: { value: 5.0, unit: "number" },
    });
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 3.3, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns true when the increase does match number", () => {
    const tracker = createTracker({
      ...expectation,
      measure: { value: 5.0, unit: "number" },
    });
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 8.0, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(true);
  });
});

describe("decrease_by tracker", () => {
  const expectation = {
    ...expectationBaseline,
    direction: "decrease_by",
    measure: { value: 5.0, unit: "percent" },
  };

  test("hasMetExpectation returns false when there are no tracked readings", () => {
    const tracker = createTracker(expectation);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns false when there is just one tracked reading", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns false when there is no decrease between readings", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 2.3, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns false when the decrease does not match percent", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 2.2, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns true when the increase does match percent", () => {
    const tracker = createTracker(expectation);
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 2.184, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(true);
  });

  test("hasMetExpectation returns false when the increase does not match number", () => {
    const tracker = createTracker({
      ...expectation,
      measure: { value: 1.0, unit: "number" },
    });
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 2.0, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(false);
  });

  test("hasMetExpectation returns true when the increase does match number", () => {
    const tracker = createTracker({
      ...expectation,
      measure: { value: 1.0, unit: "number" },
    });
    tracker.track([
      { meter: "conversion", value: 2.3, date: new Date("2018-06-27") },
      { meter: "conversion", value: 1.2, date: new Date("2018-06-28") },
    ]);
    expect(tracker.hasMetExpectation()).toBe(true);
  });
});

describe("increase_to tracker", () => {
  // Allow number and above
});

describe("decrease_to tracker", () => {
  // Allow number and below
});

describe("maintain tracker", () => {
  // Allow number/boolean/string with low percent deviation
});

describe("become tracker", () => {
  // Allow number/boolean/string with high percent stability
});
