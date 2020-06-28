const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");

const readMeters = require("./readMeters");
const stringifyReadings = require("./stringifyReadings");
const commitFile = require("./commitFile");

const READINGS_MARK = (env) => `[meter-readings:${env}]`;

async function main() {
  try {
    // Repository inputs
    const repoOwnerAndName = github.context.repo;
    const commitToken = core.getInput("repo-token");
    const commitBranch = core.getInput("readings-branch");
    const octokit = github.getOctokit(commitToken);

    // Meters & Readings file inputs
    const readingsEnv = core.getInput("readings-env");
    const metersScript = core.getInput("meters-script");
    const readingsPath = core
      .getInput("readings-path")
      .replace("${readings-env}", readingsEnv);

    // Produce readings
    const meters = require(path.resolve(metersScript));
    const readings = await readMeters(meters, readingsEnv);
    const readingsString = stringifyReadings(readings);

    // Commit changes to the branch
    const subject = `:chart_with_upwards_trend: Refresh \`${readingsEnv}\` KPIs`;
    const message = `${subject}\n\n${READINGS_MARK(readingsEnv)}`;
    const result = await commitFile({
      octokit,
      message,
      repo: repoOwnerAndName,
      branch: commitBranch,
      path: readingsPath,
      content: readingsString,
    });

    if (result.ok) {
      core.info(`"${readingsPath}" updated via ${result.sha}`);
    } else if (result.reason === "same_content") {
      core.info(`No change in "${readingsPath}", skipped update`);
    } else {
      core.setFailed(result.error);
    }

    core.setOutput("readings", readingsString);
  } catch (error) {
    core.setFailed(error);
  }
}

main();
