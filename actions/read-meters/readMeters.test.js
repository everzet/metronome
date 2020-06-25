const readMeters = require("./readMeters");

test("handles no meters", async () => {
  const readings = await readMeters({});
  expect(readings).toEqual({});
});

test("handles multiple meters", async () => {
  const readings = await readMeters({
    meter1: async () => 42,
    meter2: async () => "str",
  });
  expect(readings).toEqual({ meter1: 42, meter2: "str" });
});

test("waits for async meters to fully resolve", async () => {
  const readings = await readMeters({
    meter1: async () => new Promise((done) => done(42)),
  });
  expect(readings).toEqual({ meter1: 42 });
});

test("clearly rejects non-async meter functions", async () => {
  expect.assertions(1);
  try {
    await readMeters({ myMeter: () => 42 });
  } catch (error) {
    expect(error).toEqual(
      `Meters must be async functions, but "myMeter" is not`
    );
  }
});
