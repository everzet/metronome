module.exports = (expectation) => {
  const tracker = createReadingsTracker(expectation);

  switch (expectation.direction) {
    case "increase_by":
      return {
        ...tracker,
        hasMetExpectation: () =>
          readingsIncreasedBy(tracker.trackedReadings(), expectation.measure)
            .length > 0,
      };
    case "decrease_by":
      return {
        ...tracker,
        hasMetExpectation: () =>
          readingsDecreasedBy(tracker.trackedReadings(), expectation.measure)
            .length > 0,
      };
    case "increase_to":
      return {
        ...tracker,
        hasMetExpectation: () =>
          readingsAbove(tracker.trackedReadings(), expectation.measure).length >
          0,
      };
    case "decrease_to":
      return {
        ...tracker,
        hasMetExpectation: () =>
          readingsBelow(tracker.trackedReadings(), expectation.measure).length >
          0,
      };
    case "become":
      return {
        ...tracker,
        hasMetExpectation: () =>
          lastReadingValue(tracker.trackedReadings()) ===
          expectation.measure.value,
      };
    case "maintain":
      throw `Sorry, but ${expectation.direction} expectations are not supported yet`;
  }
};

const readingsIncreasedBy = (readings, measure) => {
  if (readings.length < 2) return [];
  const [baseline, ...since] = readings;
  const expectedValue = baseline.value + expectedDelta(baseline, measure);
  return since.filter((reading) => reading.value >= expectedValue);
};

const readingsDecreasedBy = (readings, measure) => {
  if (readings.length < 2) return [];
  const [baseline, ...since] = readings;
  const expectedValue = baseline.value - expectedDelta(baseline, measure);
  return since.filter((reading) => reading.value <= expectedValue);
};

const readingsAbove = (readings, measure) => {
  if (readings.length < 1) return [];
  return readings.filter((reading) => reading.value >= measure.value);
};

const readingsBelow = (readings, measure) => {
  if (readings.length < 1) return [];
  return readings.filter((reading) => reading.value <= measure.value);
};

const lastReadingValue = (readings) => {
  if (readings.length < 1) return undefined;
  return readings[readings.length - 1].value;
};

const expectedDelta = (baseline, measure) => {
  if (measure.unit !== "percent" && measure.unit !== "number") {
    throw `Wrong measure given. Expected percent or number, but '${measure.unit}' was given`;
  }

  if (measure.unit === "percent") {
    return (baseline.value * measure.value) / 100;
  } else {
    return measure.value;
  }
};

const createReadingsTracker = (expectation) => {
  let readings = [];
  let readingDate = null;

  const trackedReadings = () => readings;
  const lastViewedReadingDate = () => readingDate;
  const deadlineReached = () =>
    readingDate !== null && readingDate > expectation.deadline;

  const track = (newReadings) => {
    const trackedMeterReadings = newReadings.filter(
      ({ meter }) => meter === expectation.meter
    );
    const readingBeforeDeadline = trackedMeterReadings.filter(
      (reading) => reading.date < expectation.deadline
    );

    trackedMeterReadings.forEach(({ date }) => (readingDate = date));
    readings = [...readings, ...readingBeforeDeadline];
  };

  return {
    expectation,
    track,
    trackedReadings,
    lastViewedReadingDate,
    deadlineReached,
  };
};
