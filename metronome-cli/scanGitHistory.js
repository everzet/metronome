const gitRawCommits = require("git-raw-commits");
const through = require("through2");
const catFirstFileAtRevision = require("./catFirstFileAtRevision");

const GIT_LOG_OPTIONS = {
  reverse: true,
  grep: "\\[meter-readings:\\|\\[meter-expect:",
  format: "%H\n%aI\n%an\n%B",
};

const METER_READINGS_REGEX = /\[meter-readings\:(?<env>[^\]]+)\]/gi;
const METER_EXPECTATION_REGEX = /\[meter-expect\:(?:(?<env>[^\:\]]+)\:)?(?<expectation>[^\]]+)\]/gi;

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
  const readingsEnvironments = extractReadingsEnvironments(message);

  if (expectations.length > 0) {
    return {
      type: "expectations",
      sha,
      author,
      subject: rest[0],
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
      environments: readingsEnvironments,
    };
  }
};

const extractExpectations = (message) => {
  return [...message.matchAll(METER_EXPECTATION_REGEX)].map(({ groups }) => ({
    string: groups.expectation.trim(),
    environment: groups.env ? groups.env.trim() : undefined,
  }));
};

const extractReadingsEnvironments = (message) => {
  return [...message.matchAll(METER_READINGS_REGEX)].map(({ groups }) =>
    groups.env.trim()
  );
};
