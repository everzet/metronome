const gitRawCommits = require("git-raw-commits");
const through = require("through2");

const GIT_LOG_OPTIONS = {
  reverse: true,
  grep: "\\[meter-readings\\]\\|\\[meter-expectation:",
  format: "%H\n%aI\n%an\n%B",
};

const METER_EXPECTATION_REGEX = /\[meter-expectation\:(?<expectation>[^\]]+)\]/gi;

module.exports = async (cwd, onCommit) => {
  return new Promise((done) => {
    gitRawCommits(GIT_LOG_OPTIONS, { cwd })
      .pipe(
        through((message, encoding, callback) => {
          const commit = parseCommit(message.toString());
          onCommit(commit);
          callback();
        })
      )
      .on("finish", done);
  });
};

function parseCommit(string) {
  const [sha, time, author, message] = string.split("\n", 4);
  const expectations = extractExpectations(message);

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
    };
  }
}

const extractExpectations = (message) =>
  [...message.matchAll(METER_EXPECTATION_REGEX)].map(({ groups }) =>
    groups.expectation.trim()
  );