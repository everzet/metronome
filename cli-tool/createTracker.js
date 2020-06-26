module.exports = (expectation) => {
  switch (expectation.direction) {
    case "increase_by":
      const tracker = createReadingsTracker(expectation);
      return { ...tracker };
    case "decrease_by":
    case "increase_to":
    case "decrease_to":
    case "maintain":
    case "become":
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

//
// conversion will increase to 5.5 in three weeks from now
//
// wasExpectationMet()
// doesLastReadingMeetExpectation()
//
