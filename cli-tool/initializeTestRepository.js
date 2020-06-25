const fs = require("fs");
const childProcess = require("child_process");

module.exports = () => {
  const path = fs.mkdtempSync("scanGitHistoryTest");
  init(path);

  return {
    path,
    commit: (message, contents) => commit(path, message, contents),
    lastCommitSha: () => lastCommitSha(path),
    destroy: () => fs.rmdirSync(path, { recursive: true }),
  };
};

const init = (cwd) => {
  childProcess.execSync("git init", { cwd });
  childProcess.execSync('git config user.name "everzet"', { cwd });
  childProcess.execSync('git config user.email "me@me.com"', { cwd });
  commit(cwd, "initial commit");
};

const commit = (cwd, message, contents = `${Math.random()}`) => {
  if (Array.isArray(contents)) {
    contents.forEach((content, idx) =>
      fs.writeFileSync(`${cwd}/file${idx + 1}`, content)
    );
  } else {
    fs.writeFileSync(`${cwd}/file`, contents);
  }

  childProcess.execSync("git add .", { cwd });
  childProcess.execSync(`git commit -m "${message}"`, { cwd });
};

const lastCommitSha = (cwd) => {
  return childProcess.execSync("git rev-parse HEAD", { cwd }).toString().trim();
};
