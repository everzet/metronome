const yargs = require("yargs");
const chalk = require("chalk");
const print = console.log;

const scanGitHistory = require("./scanGitHistory");
const parseReadings = require("./parseReadings");
const parseExpectation = require("./parseExpectation");
const createTracker = require("./createTracker");

yargs
  .command(
    "check [path]",
    "Check set expectations against meter readings",
    (yargs) =>
      yargs.positional("path", {
        describe: "Path to the repository to be analysed",
        type: "string",
        default: process.cwd(),
      }),
    check
  )
  .command(
    "readings [path]",
    "Show all current meter readings",
    (yargs) =>
      yargs.positional("path", {
        describe: "Path to the repository to be analysed",
        type: "string",
        default: process.cwd(),
      }),
    async (argv) => argv
  )
  .command(
    "validate-commit [message]",
    "Validate commit message",
    (yargs) =>
      yargs
        .positional("message", {
          describe: "Full commit message or part of it",
          type: "string",
        })
        .require("message"),
    async (argv) => argv
  )
  .alias("help", "h")
  .options({
    env: {
      describe: "Specify readings environment to use",
      type: "string",
      default: "prod",
    },
    from: {
      describe: "Specify revision to start analysis from",
      type: "string",
      default: "",
    },
    to: {
      describe: "Specify revision to finish analysis at",
      type: "string",
      default: "HEAD",
    },
  }).argv;

async function check(argv) {
  let readings = [];
  let trackers = [];

  await scanGitHistory(
    argv.path,
    { from: argv.from, to: argv.to },
    async (commit) => {
      if (commit.type === "readings") {
        [parseReadings(commit)]
          .filter(({ ok }) => ok)
          .filter(({ env }) => env === argv.env)
          .forEach(({ readings: newReadings }) => {
            readings = newReadings;
            trackers.forEach((tracker) => tracker.track(readings));
          });
      } else if (commit.type === "expectations") {
        commit.expectations
          .map((expectation) => parseExpectation(expectation, commit.date))
          .filter(({ ok }) => ok)
          .map(({ expectation }) => ({
            ...expectation,
            sha: commit.sha,
            author: commit.author,
          }))
          .map(createTracker)
          .forEach((tracker) => {
            tracker.track(readings);
            trackers.push(tracker);
          });
      }
    }
  );

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
