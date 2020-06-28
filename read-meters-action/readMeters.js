module.exports = async (meters, environment) => {
  const promises = [];
  const readings = {};

  for (const [name, meter] of Object.entries(meters)) {
    const meterPromise = meter(environment);

    if (typeof meterPromise.then !== "function") {
      throw `Meters must be async functions, but "${name}" is not`;
    }

    meterPromise.then((result) => (readings[name] = result));
    promises.push(meterPromise);
  }

  await Promise.all(promises);

  return readings;
};
