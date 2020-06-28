const yargs = require("yargs");
const chalk = require("chalk");
const chart = require("asciichart");
const print = console.log;

const scanGitHistory = require("./scanGitHistory");
const parseReadings = require("./parseReadings");
const parseExpectation = require("./parseExpectation");
const createTracker = require("./createTracker");
const spreadDatedValues = require("./spreadDatedValues");

yargs
  .command(
    "check [path]",
    "Check set expectations against meter readings",
    (yargs) =>
      yargs
        .positional("path", {
          describe: "Path to the repository to be analysed",
          type: "string",
          default: process.cwd(),
        })
        .option("format", {
          describe: "Specify output format to use",
          choices: ["pretty", "basic"],
          default: "pretty",
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
            subject: commit.subject,
          }))
          .map(createTracker)
          .forEach((tracker) => {
            tracker.track(readings);
            trackers.push(tracker);
          });
      }
    }
  );

  const complete = trackers.filter((tracker) => tracker.reachedDeadline());
  const successes = complete.filter((tracker) => tracker.hasMetExpectation());
  const failures = complete.filter((tracker) => !tracker.hasMetExpectation());
  const pending = trackers.filter((tracker) => !tracker.reachedDeadline());

  if (argv.format === "pretty") {
    successes.forEach((tracker) => {
      const padding = "           ";
      const expectation = tracker.expectation;
      const shortSha = expectation.sha.slice(0, 7);
      print(
        chalk`{green.bold [✓]} {bold ${shortSha}} {underline ${expectation.subject}}`
      );
      print(chalk`${padding} ${expectation.string}`);
      print(
        chalk`${padding} @${
          expectation.author
        } on ${expectation.fromDate.toDateString()}`
      );
      print("");

      const readings = tracker.trackedReadings();
      const series = spreadDatedValues(readings, 50).map(({ value }) => value);
      print(chart.plot(series, { height: 4, offset: 3, padding }));
    });
  }

  if (argv.format === "basic") {
    successes.forEach(({ expectation }) =>
      print(chalk`{green ✓ ${expectation.string}}`)
    );
    failures.forEach(({ expectation }) =>
      print(chalk`{red ✕ ${expectation.string}}`)
    );
    pending.forEach(({ expectation }) =>
      print(chalk`{yellow ? ${expectation.string}}`)
    );
  }
}
