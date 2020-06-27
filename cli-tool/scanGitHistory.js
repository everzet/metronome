const gitRawCommits = require("git-raw-commits");
const through = require("through2");

const GIT_LOG_OPTIONS = {
  reverse: true,
  grep: "\\[meter-readings:\\|\\[meter-expectation:",
  format: "%H\n%aI\n%an\n%B",
};

const METER_READINGS_REGEX = /\[meter-readings\:(?<branch>[^\]]+)\]/i;
const METER_EXPECTATION_REGEX = /\[meter-expectation\:(?<expectation>[^\]]+)\]/gi;

module.exports = async (cwd, onCommit) => {
  return new Promise((done) => {
    gitRawCommits(GIT_LOG_OPTIONS, { cwd })
      .pipe(
        through((message, encoding, callback) => {
          const parsedCommit = parseCommit(message.toString());
          onCommit(parsedCommit).then(callback);
        })
      )
      .on("finish", done);
  });
};

const parseCommit = (string) => {
  const [sha, time, author, ...rest] = string.split("\n");
  const message = rest.join("\n");
  const expectations = extractExpectations(message);
  const branch = extractBranch(message);

  if (expectations.length > 0) {
    return {
      type: "expectations",
      sha,
      author,
      time: Date.parse(time),
      expectations,
    };
  } else {
    return {
      type: "readings",
      sha,
      time: Date.parse(time),
      branch,
    };
  }
};

const extractExpectations = (message) => {
  return [...message.matchAll(METER_EXPECTATION_REGEX)].map(({ groups }) =>
    groups.expectation.trim()
  );
};

const extractBranch = (message) => {
  const match = message.match(METER_READINGS_REGEX);
  if (match) {
    return match.groups.branch.trim();
  } else {
    return null;
  }
};
