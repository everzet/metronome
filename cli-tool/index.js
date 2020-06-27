const scanGitHistory = require("./scanGitHistory");
const catFirstFileAtRevision = require("./catFirstFileAtRevision");
const parseReadings = require("./parseReadings");
const parseExpectation = require("./parseExpectation");
const createTracker = require("./createTracker");

const path = process.cwd();
let readings = [];
let trackers = [];

try {
  (async () => {
    await scanGitHistory(path, async (commit) => {
      if (commit.type === "readings") {
        const file = await catFirstFileAtRevision(path, commit.sha);
        [parseReadings({ ...commit, ...file })]
          .filter(({ ok }) => ok)
          .forEach(({ readings: newReadings }) => {
            readings = newReadings;
            trackers.forEach((tracker) => tracker.track(readings));
          });
      } else if (commit.type === "expectations") {
        commit.expectations
          .map((expectation) => parseExpectation(expectation, commit.date))
          .filter(({ ok }) => ok)
          .map(({ expectation }) => expectation)
          .map(createTracker)
          .forEach((tracker) => {
            tracker.track(readings);
            trackers.push(tracker);
          });
      }
    });

    const inProgress = trackers.filter((tracker) => !tracker.reachedDeadline());
    const complete = trackers.filter((tracker) => tracker.reachedDeadline());
    const success = complete.filter((tracker) => tracker.hasMetExpectation());
    const failure = complete.filter((tracker) => !tracker.hasMetExpectation());

    console.log("Successful:");
    success.forEach(({ expectation }) =>
      console.log(`  - ${expectation.string}`)
    );

    console.log("Failed:");
    failure.forEach(({ expectation }) =>
      console.log(`  - ${expectation.string}`)
    );

    console.log("In progress:");
    inProgress.forEach(({ expectation }) =>
      console.log(`  - ${expectation.string}`)
    );
  })();
} catch (e) {
  console.error(e);
}
