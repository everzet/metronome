const gitRawCommits = require("git-raw-commits");
const through = require("through2");
const catFirstFileAtRevision = require("./catFirstFileAtRevision");

const GIT_LOG_OPTIONS = {
  reverse: true,
  grep: "\\[meter-readings:\\|\\[meter-expect:",
  format: "%H\n%aI\n%an\n%B",
};

const METER_READINGS_REGEX = /\[meter-readings\:(?<branch>[^\]]+)\]/i;
const METER_EXPECTATION_REGEX = /\[meter-expect\:(?<expectation>[^\]]+)\]/gi;

module.exports = async (cwd, opts, onCommit) => {
  return new Promise((done) => {
    gitRawCommits({ ...GIT_LOG_OPTIONS, ...opts }, { cwd })
      .pipe(
        through((message, encoding, callback) => {
          parseCommit(cwd, message.toString()).then(onCommit).then(callback);
        })
      )
      .on("finish", done);
  });
};

const parseCommit = async (cwd, string) => {
  const [sha, date, author, ...rest] = string.split("\n");
  const message = rest.join("\n");
  const expectations = extractExpectations(message);
  const branch = extractBranch(message);

  if (expectations.length > 0) {
    return {
      type: "expectations",
      sha,
      author,
      date: new Date(date),
      expectations,
    };
  } else {
    const file = await catFirstFileAtRevision(cwd, sha);

    return {
      ...file,
      type: "readings",
      sha,
      date: new Date(date),
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
