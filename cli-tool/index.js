const yargs = require("yargs");
const chalk = require("chalk");
const print = console.log;

const scanGitHistory = require("./scanGitHistory");
const parseReadings = require("./parseReadings");
const parseExpectation = require("./parseExpectation");
const createTracker = require("./createTracker");

yargs.command(
  "run",
  "analyse current repository branch",
  (yargs) => yargs,
  analyse
).argv;

async function analyse(argv) {
  const path = process.cwd();
  let readings = [];
  let trackers = [];

  await scanGitHistory(path, async (commit) => {
    if (commit.type === "readings") {
      [parseReadings(commit)]
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

  print(chalk`
{green Successful:}
${success.map(({ expectation }) => `  - ${expectation.string}`).join("\n")}

{red Failed:}
${failure.map(({ expectation }) => `  - ${expectation.string}`).join("\n")}

{yellow In progress:}
${inProgress.map(({ expectation }) => `  - ${expectation.string}`).join("\n")}
    `);
}
