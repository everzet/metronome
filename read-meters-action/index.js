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
    const repoBranch = core.getInput("repo-branch");
    const repoToken = core.getInput("repo-token");

    // Meters & Readings file inputs
    const metersScript = core.getInput("meters-script");
    const readingsPath = core
      .getInput("readings-path")
      .replace("${repo-branch}", repoBranch);

    // Produce readings
    const meters = require(path.resolve(metersScript));
    const readings = await readMeters(meters);
    const readingsString = stringifyReadings(readings);

    // Commit changes to the branch
    const commit = await commitFile({
      octokit: github.getOctokit(repoToken),
      repo: repoOwnerAndName,
      branch: repoBranch,
      path: readingsPath,
      content: readingsString,
      message: `${COMMIT_MESSAGE}\n\n${READINGS_MARK(repoBranch)}`,
    });

    if (commit.ok) {
      core.info(
        `Committed reading changes to "${readingsPath}" via ${commit.sha}`
      );
    } else if (commit.reason === "same_content") {
      core.info("No change in readings, skipping commit");
    }

    core.setOutput("readings", readings);
  } catch (error) {
    core.setFailed(error);
  }
}

main();
