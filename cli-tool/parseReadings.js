const TOML = require("@iarna/toml");

module.exports = (commit) => {
  try {
    const readingsObject = TOML.parse(commit.content);
    const readings = [...Object.entries(readingsObject)].map(
      ([meter, value]) => ({
        date: commit.date,
        path: commit.path,
        sha: commit.sha,
        meter,
        value,
      })
    );

    return { ok: true, readings };
  } catch (error) {
    return { ok: false, error };
  }
};
