const createTracker = require("./createTracker");

const expectationBaseline = {
  meter: "conversion",
  measure: { value: 5.0, unit: "percent" },
  fromDate: new Date("2018-06-26T12:00:00.000Z"),
  deadline: new Date("2018-07-26T12:00:00.000Z"),
};

describe("any tracker", () => {
  const expectation = {
    ...expectationBaseline,
    string: "conversion will increase by 5% in 1 month",
    direction: "increase_by",
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

describe("increase_by tracker", () => {});

describe("decrease_by tracker", () => {});

describe("increase_to tracker", () => {});

describe("decrease_to tracker", () => {});

describe("maintain tracker", () => {});

describe("become tracker", () => {});
