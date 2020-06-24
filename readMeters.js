const path = require("path");

module.exports = async (metersScript) => {
  const meters = require(path.join('./', metersScript));
  const promises = [];
  const readings = {};

  for (const name of Object.keys(meters)) {
    promises.push(meters[name]().then((result) => (readings[name] = result)));
  }

  await Promise.all(promises);

  return readings;
};
