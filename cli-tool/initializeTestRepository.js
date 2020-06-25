const fs = require("fs");
const childProcess = require("child_process");

module.exports = () => {
  const path = fs.mkdtempSync("scanGitHistoryTest");
  init(path);

  return {
    path,
    commit: (message) => commit(path, message),
    destroy: () => fs.rmdirSync(path, { recursive: true }),
  };
};

const init = (repo) => {
  childProcess.execSync("git init", { cwd: repo });
  childProcess.execSync('git config user.name "everzet"', { cwd: repo });
  childProcess.execSync('git config user.email "me@me.com"', { cwd: repo });
  commit(repo, "initial commit");
};

const commit = (repo, message) => {
  fs.writeFileSync(`${repo}/file`, `${Math.random()}`);
  childProcess.execSync("git add .", { cwd: repo });
  childProcess.execSync(`git commit -m "${message}"`, { cwd: repo });
};
