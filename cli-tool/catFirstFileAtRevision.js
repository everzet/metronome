const childProcess = require("child_process");

module.exports = async (cwd, sha) => {
  return new Promise((done, error) => {
    childProcess.exec(
      `git show --pretty="" --name-only ${sha}`,
      { cwd },
      (err, stdout, stderr) => {
        if (err) return error(stderr);
        done(stdout.toString().trim().split("\n")[0]);
      }
    );
  }).then(
    (path) =>
      new Promise((done, error) => {
        childProcess.exec(
          `git show ${sha}:${path}`,
          { cwd },
          (err, stdout, stderr) => {
            if (err) return error(stderr);
            done({ path, content: stdout.toString() });
          }
        );
      })
  );
};
