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

  if (argv.format === "basic") {
    basicPrint(trackers);
  }

  if (argv.format === "pretty") {
    prettyPrint(trackers);
  }

  printStatistics(trackers);
}

const printStatistics = (trackers) => {
  print("");
  const complete = trackers.filter((tracker) => tracker.reachedDeadline());
  const successes = complete.filter((tracker) => tracker.hasMetExpectation());
  const failures = complete.filter((tracker) => !tracker.hasMetExpectation());
  const pending = trackers.filter((tracker) => !tracker.reachedDeadline());

  print(
    chalk.reset(
      trackers.length,
      "expectations",
      "(" +
        [
          chalk.green(successes.length, "succeeded"),
          chalk.red(failures.length, "failed"),
          chalk.blue(pending.length, "in progress"),
        ].join(", ") +
        ")"
    )
  );
};

const basicPrint = (trackers) => {
  const complete = trackers.filter((tracker) => tracker.reachedDeadline());
  const successes = complete.filter((tracker) => tracker.hasMetExpectation());
  const failures = complete.filter((tracker) => !tracker.hasMetExpectation());
  const pending = trackers.filter((tracker) => !tracker.reachedDeadline());

  successes.forEach(({ expectation }) =>
    print(chalk.green("✓", expectation.sha.slice(0, 7), expectation.string))
  );
  failures.forEach(({ expectation }) =>
    print(chalk.red("✕", expectation.sha.slice(0, 7), expectation.string))
  );
  pending.forEach(({ expectation }) =>
    print(chalk.blue("?", expectation.sha.slice(0, 7), expectation.string))
  );
};

const prettyPrint = (trackers) => {
  const complete = trackers.filter((tracker) => tracker.reachedDeadline());
  const successes = complete.filter((tracker) => tracker.hasMetExpectation());
  const failures = complete.filter((tracker) => !tracker.hasMetExpectation());
  const pending = trackers.filter((tracker) => !tracker.reachedDeadline());

  successes.forEach((tracker) => prettyPrintTracker("✓", tracker));
  failures.forEach((tracker) => prettyPrintTracker("✕", tracker));
  pending.forEach((tracker) => prettyPrintTracker("?", tracker));
};

const prettyPrintTracker = (mark, tracker) => {
  const SHA_SIZE = 7;
  const BASE_INDENT = 1;
  const DETAILS_INDENT = BASE_INDENT + SHA_SIZE + 2;

  const HEADING_COLOR = mark === "✓" ? "reset" : mark === "✕" ? "red" : "blue";
  const HEADING_MARK_COLOR =
    mark === "✓" ? "greenBright" : mark === "✕" ? "redBright" : "blueBright";

  // Heading
  print(
    chalk[HEADING_COLOR](
      " ".repeat(BASE_INDENT - 1),
      chalk[HEADING_MARK_COLOR].bold(mark),
      chalk.dim.bold(tracker.expectation.sha.slice(0, SHA_SIZE)),
      tracker.expectation.subject
    )
  );

  // Description
  print(
    chalk.reset(
      " ".repeat(DETAILS_INDENT),
      tracker.expectation.string.replace(
        /^[a-zA-Z_]+(?:[a-zA-Z_0-9])?/,
        chalk.bold("$&")
      )
    )
  );
  print(
    chalk.reset(
      " ".repeat(DETAILS_INDENT),
      chalk.dim(
        "--",
        `@${tracker.expectation.author}`,
        "on",
        tracker.expectation.fromDate.toDateString()
      )
    )
  );

  // Show readings
  print("");
  printReadings(tracker, DETAILS_INDENT);

  print("");
};

const printReadings = (tracker, indent) => {
  const CHARTABLE_TYPES = [
    "increase_by",
    "decrease_by",
    "increase_to",
    "decrease_to",
  ];

  const type = tracker.type;
  const target = tracker.target();
  const readings = tracker.trackedReadings();

  if (readings.length < 2) {
    print(
      chalk.reset(" ".repeat(indent + 3), chalk.dim("Awaiting readings..."))
    );
  } else if (CHARTABLE_TYPES.includes(type)) {
    printChart([readings, [{ date: new Date(), value: target }]], {
      indent,
      colors: chalk.level !== 0 ? ["white", "green"] : [],
      width: 50,
      height: 4,
      footerLeft: readings[0].date.toDateString(),
      footerRight: readings[readings.length - 1].date.toDateString(),
    });
  } else {
    readings
      .reverse()
      .filter(
        (reading, index, readings) =>
          reading.value !== (readings[index - 1] || { value: undefined }).value
      )
      .slice(0, 4)
      .forEach((reading) => {
        print(
          chalk.reset(
            " ".repeat(indent - 2),
            chalk.grey("■"),
            chalk.reset[reading.value === target ? "green" : "red"](
              reading.value
            ),
            chalk.grey("on"),
            chalk.grey(reading.date.toDateString())
          )
        );
      });
  }
};

const printChart = (
  series,
  { colors, indent, width, height, footerLeft, footerRight }
) => {
  // Chart
  print(
    chalk.grey(
      chart.plot(
        series.map((s) =>
          spreadDatedValues(s, width).map(({ value }) => value)
        ),
        {
          padding: " ".repeat(indent),
          height,
          colors: colors.map((color) => chart[color]),
        }
      )
    )
  );

  // Footer
  print(
    chalk.grey(
      " ".repeat(indent),
      "└",
      footerLeft.padEnd(width / 2 - 2),
      footerRight.padStart(width / 2 - 3),
      "┘ "
    )
  );
};
