module.exports = (commit) => {
  try {
    const readingsObject = JSON.parse(commit.content);
    const readings = [...Object.entries(readingsObject)].map(
      ([meter, value]) => ({
        date: commit.date,
        path: commit.path,
        sha: commit.sha,
        meter,
        value,
      })
    );

    return { ok: true, ...commit, readings };
  } catch (error) {
    return { ok: false, ...commit, error };
  }
};
