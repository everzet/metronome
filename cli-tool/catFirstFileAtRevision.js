const childProcess = require("child_process");

module.exports = (cwd, sha) => {
  const path = childProcess
    .execSync(`git show --pretty="" --name-only ${sha}`, { cwd })
    .toString()
    .trim()
    .split("\n")[0];

  const content = childProcess
    .execSync(`git show ${sha}:${path}`, { cwd })
    .toString();

  return { path, content };
};
