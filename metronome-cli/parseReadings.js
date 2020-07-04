module.exports = ({ path, content, sha, date }) => {
  try {
    const readingsObject = JSON.parse(content);
    const readings = [
      ...Object.entries(readingsObject),
    ].map(([meter, value]) => ({ date, path, sha, meter, value }));

    return { ok: true, readings };
  } catch (error) {
    return { ok: false, error };
  }
};
