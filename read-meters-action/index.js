const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");

const readMeters = require("./readMeters");
const stringifyReadings = require("./stringifyReadings");
const fileContains = require("./fileContains");
const commitFile = require("./commitFile");

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

    // Commit readings into repo, if changed
    if (fileContains(path.resolve(readingsPath), readingsString)) {
      core.info("No change in readings, skipping commit");
    } else {
      const ref = await commitFile({
        git: github.getOctokit(repoToken).git,
        repo: repoOwnerAndName,
        ref: `heads/${repoBranch}`,
        path: readingsPath,
        content: readingsString,
        message: "Update meter readings",
      });
      core.info(
        `Committed reading changes to "${readingsPath}" via ${ref.sha}`
      );
    }

    core.setOutput("readings", readings);
  } catch (error) {
    core.setFailed(error);
  }
}

main();
