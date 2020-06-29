#!/usr/bin/env node

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
    "test [path]",
    "Test set expectations against meter readings",
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
    test
  )
  .command(
    "meters [path]",
    "Show all current meters and their readings",
    (yargs) =>
      yargs.positional("path", {
        describe: "Path to the repository to be analysed",
        type: "string",
        default: process.cwd(),
      }),
    meters
  )
  .command(
    "expect [message]",
    "Validate expectation string",
    (yargs) =>
      yargs
        .positional("message", {
          describe: "Full commit message or part of it",
          type: "string",
        })
        .require("message"),
    validateExpectation
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

async function test(argv) {
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

async function meters(argv) {
  let readings = {};

  await scanGitHistory(
    argv.path,
    { from: argv.from, to: argv.to },
    async (commit) => {
      if (commit.type === "readings") {
        [parseReadings(commit)]
          .filter(({ ok }) => ok)
          .filter(({ env }) => env === argv.env)
          .forEach(({ readings: newReadings }) => {
            newReadings.forEach((reading) => {
              readings[reading.meter] = [
                ...(readings[reading.meter] || []),
                reading,
              ];
            });
          });
      }
    }
  );

  [...Object.entries(readings)].map(([meter, readings], idx) => {
    print(
      chalk(
        " ".repeat(3),
        chalk.dim.bold(`${idx + 1}.`.padStart(4, "0")),
        chalk.bold.underline(meter),
        chalk.dim("="),
        chalk.reset(readings[readings.length - 1].value)
      )
    );
    print("");
    printReadings(readings, null, 8);
    print("");
  });

  print(chalk.reset(Object.keys(readings).length, "meters"));
}

async function validateExpectation(argv) {
  const message = argv.message;
  const result = parseExpectation(message, new Date("2020-06-29 10:00"));

  if (!result.ok) {
    print(chalk.reset("[meter-expect:", chalk.red.bold(message), "]"));
    print("");
    print(chalk.red(result.error));
    print("");
    process.exit(1);
  } else {
    print(chalk.reset("[meter-expect:", chalk.green.bold(message), "]"));
    print("");

    print(chalk.bold.dim("meter:"), chalk.reset(result.expectation.meter));
    print(
      chalk.bold.dim("direction:"),
      chalk.reset(result.expectation.direction)
    );
    print(
      chalk.bold.dim("measure:"),
      chalk.reset(result.expectation.measure.value),
      chalk.reset(`(${result.expectation.measure.unit})`)
    );
    print(
      chalk.bold.dim("example fromDate (commit date):"),
      chalk.reset(result.expectation.fromDate.toDateString())
    );
    print(
      chalk.bold.dim("example deadline (calculated):"),
      chalk.reset(result.expectation.deadline.toDateString())
    );
  }

  print("");
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
  printReadings(tracker.trackedReadings(), tracker.target(), DETAILS_INDENT);

  print("");
};

const printReadings = (readings, target, indent) => {
  if (readings.length < 2) {
    print(
      chalk.reset(" ".repeat(indent + 3), chalk.dim("Awaiting readings..."))
    );
  } else if (typeof readings[0].value === "number") {
    printChart(
      target ? [readings, [{ date: new Date(), value: target }]] : [readings],
      {
        indent,
        colors: chalk.level !== 0 ? ["white", "green"] : [],
        width: 50,
        height: 4,
        footerLeft: readings[0].date.toDateString(),
        footerRight: readings[readings.length - 1].date.toDateString(),
      }
    );
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
            chalk.reset[
              target ? (reading.value === target ? "green" : "red") : "reset"
            ](reading.value),
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
