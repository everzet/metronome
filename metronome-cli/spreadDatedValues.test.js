const spreadDatedValues = require("./spreadDatedValues");

test("single value", () => {
  const value = { date: new Date(), value: 42 };
  const spread = spreadDatedValues([value], 3);
  expect(spread).toEqual([value, value, value]);
});

test("two values", () => {
  const values = [
    { date: new Date("2018-07-20 13:22"), value: 12 },
    { date: new Date("2018-07-24 12:33"), value: 14 },
  ];

  expect(spreadDatedValues(values, 2)).toEqual(values);
  expect(spreadDatedValues(values, 3)).toEqual([
    values[0],
    values[0],
    values[1],
  ]);
  expect(spreadDatedValues(values, 4)).toEqual([
    values[0],
    values[0],
    values[0],
    values[1],
  ]);
});

test("three values", () => {
  const values = [
    { date: new Date("2018-07-20 19:22"), value: 12 },
    { date: new Date("2018-07-24 12:33"), value: 14 },
    { date: new Date("2018-07-28 12:33"), value: 16 },
  ];

  expect(spreadDatedValues(values, 2)).toEqual([values[0], values[2]]);
  expect(spreadDatedValues(values, 3)).toEqual([
    values[0],
    values[1],
    values[2],
  ]);
  expect(spreadDatedValues(values, 4)).toEqual([
    values[0],
    values[0],
    values[1],
    values[2],
  ]);
  expect(spreadDatedValues(values, 6)).toEqual([
    values[0],
    values[0],
    values[0],
    values[1],
    values[1],
    values[2],
  ]);
});

test("measurements are spread according to date/time weight", () => {
  const values = [
    { date: new Date("2018-07-20 13:22"), value: 12 },
    { date: new Date("2018-07-24 13:22"), value: 18 },
    { date: new Date("2018-07-28 13:22"), value: 20 },
    { date: new Date("2018-08-05 13:22"), value: 25 },
    { date: new Date("2018-08-24 12:33"), value: 35 },
  ];
  expect(spreadDatedValues(values, 10)).toEqual([
    values[0],
    values[0],
    values[1],
    values[2],
    values[2],
    values[3],
    values[3],
    values[3],
    values[3],
    values[4],
  ]);
});
