const fs = require("fs");
const childProcess = require("child_process");

module.exports = (params) => {
  const path = fs.mkdtempSync("/tmp/metronomeTestRepo");
  init(path, params);

  return {
    path,
    commit: (message, params) => commit(path, message, params),
    destroy: () => fs.rmdirSync(path, { recursive: true }),
  };
};

const init = (cwd, params) => {
  childProcess.execSync("git init", { cwd });
  childProcess.execSync('git config user.name "everzet"', { cwd });
  childProcess.execSync('git config user.email "me@me.com"', { cwd });
  commit(cwd, "initial commit", params);
};

const commit = (cwd, message, params = {}) => {
  let env = process.env;
  if (params.date) {
    env = {
      ...env,
      GIT_AUTHOR_DATE: `${params.date}`,
      GIT_COMMITTER_DATE: `${params.date}`,
    };
  }

  const contents = params.contents ? params.contents : `${Math.random()}`;

  if (Array.isArray(contents)) {
    contents.forEach((content, idx) =>
      fs.writeFileSync(`${cwd}/file${idx + 1}`, content)
    );
  } else {
    fs.writeFileSync(`${cwd}/file`, contents);
  }

  childProcess.execSync("git add .", { cwd, env });

  return childProcess
    .execSync(`git commit -m "${message}"`, { cwd, env })
    .toString()
    .match(/^\[master (?<sha>[^\]]+)\]/).groups.sha;
};
