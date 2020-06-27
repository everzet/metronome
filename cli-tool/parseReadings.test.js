const parseReadings = require("./parseReadings");

test("successfully parses readings from an enchanced commit", () => {
  const commit = {
    sha: "hash",
    date: new Date(),
    path: "/some/path",
    content: `
meter1 = "value"
meter2 = 25.3
    `,
  };

  const readings = parseReadings(commit);

  expect(readings).toEqual({
    ok: true,
    readings: [
      {
        sha: commit.sha,
        date: commit.date,
        path: "/some/path",
        meter: "meter1",
        value: "value",
      },
      {
        sha: commit.sha,
        date: commit.date,
        path: "/some/path",
        meter: "meter2",
        value: 25.3,
      },
    ],
  });
});

test("handles parsing errors", () => {
  const commit = {
    sha: "hash",
    date: new Date(),
    path: "/some/path",
    content: `~NOT_A_TOML~`,
  };

  expect(parseReadings(commit).ok).toEqual(false);
});
