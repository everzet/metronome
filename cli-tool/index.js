const TOML = require("@iarna/toml");
const scanGitHistory = require("./scanGitHistory");
const catFirstFileAtRevision = require("./catFirstFileAtRevision");
const parseExpectation = require("./parseExpectation");
const createTracker = require("./createTracker");

const wd = process.cwd();
let readings = [];
let trackers = [];

try {
  (async () => {
    await scanGitHistory(wd, async (commit) => {
      if (commit.type === "readings") {
        const { path, content } = await catFirstFileAtRevision(wd, commit.sha);
        readings = [...Object.entries(TOML.parse(content))].map(
          ([meter, value]) => ({
            meter,
            value,
            date: commit.date,
          })
        );
        trackers.forEach((tracker) => tracker.track(readings));
      } else if (commit.type === "expectations") {
        const expectations = commit.expectations
          .map((expectation) => parseExpectation(expectation, commit.date))
          .filter(({ ok }) => ok)
          .map(({ expectation }) => expectation);

        const newTrackers = expectations.map(createTracker);

        newTrackers.forEach((tracker) => tracker.track(readings));
        trackers = [...trackers, ...newTrackers];
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
