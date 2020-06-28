module.exports = (values, length) => {
  const min = values[0].date.getTime();
  const max = values[values.length - 1].date.getTime();
  const inc = (max - min) / (length - 1);

  return [...Array(length)]
    .map((_, idx) => Math.ceil(min + inc * idx))
    .map((time) => new Date(time))
    .map((date) =>
      values
        .filter(
          (value, idx, values) =>
            date >= value.date &&
            date < (values[idx + 1] || { date: new Date(max + 1) }).date
        )
        .shift()
    );
};
