const childProcess = require("child_process");

module.exports = async (cwd, sha) => {
  return new Promise((done, error) => {
    childProcess.exec(
      `git show --pretty="" --name-only ${sha}`,
      { cwd },
      (err, out) => {
        if (err) return error(e);
        done(out.toString().trim().split("\n")[0]);
      }
    );
  }).then(
    (path) =>
      new Promise((done, error) => {
        childProcess.exec(`git show ${sha}:${path}`, { cwd }, (err, out) => {
          if (err) return error(e);
          done({ path, content: out.toString() });
        });
      })
  );
};
