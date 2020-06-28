const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");

const readMeters = require("./readMeters");
const stringifyReadings = require("./stringifyReadings");
const commitFile = require("./commitFile");

const COMMIT_MESSAGE = ":thermometer: Provide updated meter readings";
const READINGS_MARK = (branch) => `[meter-readings:${branch}]`;

async function main() {
  try {
    // Repository inputs
    const repoOwnerAndName = github.context.repo;
    const readingsBranch = core.getInput("readings-branch");
    const repoToken = core.getInput("repo-token");

    // Meters & Readings file inputs
    const metersScript = core.getInput("meters-script");
    const readingsPath = core
      .getInput("readings-path")
      .replace("${readings-branch}", readingsBranch);

    // Produce readings
    const meters = require(path.resolve(metersScript));
    const readings = await readMeters(meters);
    const readingsString = stringifyReadings(readings);

    // Commit changes to the branch
    const octokit = github.getOctokit(repoToken);
    const message = `${COMMIT_MESSAGE}\n\n${READINGS_MARK(readingsBranch)}`;
    const result = await commitFile({
      octokit,
      message,
      repo: repoOwnerAndName,
      branch: readingsBranch,
      path: readingsPath,
      content: readingsString,
    });

    if (result.ok) {
      core.info(`Readings updated in "${readingsPath}" via ${result.sha}`);
    } else if (result.reason === "same_content") {
      core.info("No change in readings, skipped update");
    } else {
      core.setFailed(result.error);
    }

    core.setOutput("readings", readingsString);
  } catch (error) {
    core.setFailed(error);
  }
}

main();
