module.exports = (readings) => JSON.stringify(sanitize(readings), null, 2);

const sanitize = (raw) => {
  const sanitized = {};

  Object.keys(raw)
    .sort()
    .forEach((key) => {
      maybeNull = raw[key];
      if (maybeNull !== null && maybeNull !== undefined) {
        sanitized[key] = maybeNull;
      }
    });

  return sanitized;
};
