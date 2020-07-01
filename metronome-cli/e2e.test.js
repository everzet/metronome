const childProcess = require("child_process");
const initializeTestRepository = require("./initializeTestRepository");

let repo, commits;
beforeAll(() => {
  repo = initializeTestRepository({
    date: "2020-03-26 09:30",
  });

  commits = [
    {
      date: "2020-04-01 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 10.3,
        "desktop_conversion_rate": 1.2
      }`,
    },
    {
      date: "2020-04-01 13:15",
      message: `Remove extra step in desktop checkout
      [meter-expect: desktop_conversion_rate will increase by 50% in 2 weeks ]
      `,
    },
    {
      date: "2020-04-03 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 10.05,
        "desktop_conversion_rate": 1.21,
        "gdpr_compliant": false
      }`,
    },
    {
      date: "2020-04-04 11:20",
      message: `Implement customer export space
      [meter-expect:prod: gdpr_compliant will become true in 2 months ]
      `,
    },
    {
      date: "2020-04-05 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 10.2,
        "desktop_conversion_rate": 1.3,
        "gdpr_compliant": false,
        "team_mood": "sad"
      }`,
    },
    {
      date: "2020-04-06 09:30",
      message: `Expand error handling and logging on frontend
      [meter-expect: frontend_error_rate will decrease to 6.0 in 4 days]
      [meter-expect: team_mood will become 'happy' in 1 week ]
      `,
    },
    {
      date: "2020-04-07 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 8.2,
        "desktop_conversion_rate": 1.43,
        "gdpr_compliant": false,
        "team_mood": "sad"
      }`,
    },
    {
      date: "2020-04-09 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 5.4,
        "desktop_conversion_rate": 1.51,
        "gdpr_compliant": false,
        "team_mood": "happy"
      }`,
    },
    {
      date: "2020-04-11 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 4.82,
        "desktop_conversion_rate": 1.65,
        "gdpr_compliant": false,
        "team_mood": "concerned"
      }`,
    },
    {
      date: "2020-04-13 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 4.5,
        "desktop_conversion_rate": 1.82,
        "gdpr_compliant": false,
        "team_mood": "concerned"
      }`,
    },
    {
      date: "2020-04-15 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 4.9,
        "desktop_conversion_rate": 1.94,
        "gdpr_compliant": false,
        "team_mood": "sad"
      }`,
    },
    {
      date: "2020-04-17 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 4.3,
        "desktop_conversion_rate": 1.92,
        "gdpr_compliant": false,
        "team_mood": "sad"
      }`,
    },
    {
      date: "2020-04-19 00:01",
      message: "[meter-readings:prod]",
      content: `{
        "frontend_error_rate": 4.6,
        "desktop_conversion_rate": 1.97,
        "gdpr_compliant": false,
        "team_mood": "sad"
      }`,
    },
  ].map((commit) => {
    const sha = repo.commit(commit.message, {
      date: commit.date,
      contents: commit.content,
    });
    return { ...commit, sha };
  });
});

afterAll(() => {
  repo.destroy();
});

describe("test", () => {
  test("default", () => {
    const output = childProcess
      .execSync(`node ${__dirname}/index.js test ${repo.path} --format basic`, {
        env: { ...process.env, FORCE_COLOR: 0 },
      })
      .toString();

    expect(output.trim()).toEqual(
      `
✓ ${commits[1].sha} desktop_conversion_rate will increase by 50% in 2 weeks
✓ ${commits[5].sha} frontend_error_rate will decrease to 6.0 in 4 days
✕ ${commits[5].sha} team_mood will become 'happy' in 1 week
? ${commits[3].sha} gdpr_compliant will become true in 2 months

4 expectations (2 succeeded, 1 failed, 1 in progress)
`.trim()
    );
  });

  test("--from", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js test ${repo.path} --from ${commits[2].sha} --format basic`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
✓ ${commits[5].sha} frontend_error_rate will decrease to 6.0 in 4 days
✕ ${commits[5].sha} team_mood will become 'happy' in 1 week
? ${commits[3].sha} gdpr_compliant will become true in 2 months

3 expectations (1 succeeded, 1 failed, 1 in progress)
    `.trim()
    );
  });

  test("--to", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js test ${repo.path} --to ${
          commits[commits.length - 5].sha
        } --format basic`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
✓ ${commits[5].sha} frontend_error_rate will decrease to 6.0 in 4 days
? ${commits[1].sha} desktop_conversion_rate will increase by 50% in 2 weeks
? ${commits[3].sha} gdpr_compliant will become true in 2 months
? ${commits[5].sha} team_mood will become 'happy' in 1 week

4 expectations (1 succeeded, 0 failed, 3 in progress)
`.trim()
    );
  });

  test("--env", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js test ${repo.path} --env test --format basic`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
? ${commits[1].sha} desktop_conversion_rate will increase by 50% in 2 weeks
? ${commits[5].sha} frontend_error_rate will decrease to 6.0 in 4 days
? ${commits[5].sha} team_mood will become 'happy' in 1 week

3 expectations (0 succeeded, 0 failed, 3 in progress)
`.trim()
    );
  });

  test("--format pretty", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js test ${repo.path} --format pretty`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
 ✓ ${commits[1].sha} Remove extra step in desktop checkout
           desktop_conversion_rate will increase by 50% in 2 weeks
           -- @everzet on Wed Apr 01 2020

      1.94 ┼─────────────────────────────────────────────────${" "}
      1.75 ┤                                  ╭──────╯       ${" "}
      1.57 ┤                    ╭─────────────╯              ${" "}
      1.39 ┤      ╭─────────────╯                            ${" "}
      1.20 ┼──────╯                                          ${" "}
           └ Wed Apr 01 2020                Wed Apr 15 2020 ┘${" "}

 ✓ ${commits[5].sha} Expand error handling and logging on frontend
           frontend_error_rate will decrease to 6.0 in 4 days
           -- @everzet on Mon Apr 06 2020

     10.20 ┼────────────────────────╮                        ${" "}
      9.00 ┤                        │                        ${" "}
      7.80 ┤                        ╰───────────────────────╮${" "}
      6.60 ┤                                                │${" "}
      5.40 ┼─────────────────────────────────────────────────${" "}
           └ Sun Apr 05 2020                Thu Apr 09 2020 ┘${" "}

 ✕ ${commits[5].sha} Expand error handling and logging on frontend
           team_mood will become 'happy' in 1 week
           -- @everzet on Mon Apr 06 2020

         ■ concerned on Mon Apr 13 2020
         ■ happy on Thu Apr 09 2020
         ■ sad on Tue Apr 07 2020

 ? ${commits[3].sha} Implement customer export space
           gdpr_compliant will become true in 2 months
           -- @everzet on Sat Apr 04 2020

         ■ false on Sun Apr 19 2020


4 expectations (2 succeeded, 1 failed, 1 in progress)
`.trim()
    );
  });
});

test("meters", () => {
  const output = childProcess
    .execSync(`node ${__dirname}/index.js meters ${repo.path}`, {
      env: { ...process.env, FORCE_COLOR: 0 },
    })
    .toString();

  expect(output.trim()).toEqual(
    `
    001. frontend_error_rate = 4.6

   10.30 ┼────────────────╮                                ${" "}
    8.80 ┤                │                                ${" "}
    7.30 ┤                ╰────╮                           ${" "}
    5.80 ┤                     ╰─────╮                     ${" "}
    4.30 ┤                           ╰─────────────────────${" "}
         └ Wed Apr 01 2020                Sun Apr 19 2020 ┘${" "}

    002. desktop_conversion_rate = 1.97

    1.97 ┤                                      ╭──────────${" "}
    1.78 ┤                           ╭──────────╯          ${" "}
    1.58 ┤                     ╭─────╯                     ${" "}
    1.39 ┤          ╭──────────╯                           ${" "}
    1.20 ┼──────────╯                                      ${" "}
         └ Wed Apr 01 2020                Sun Apr 19 2020 ┘${" "}

    003. gdpr_compliant = false

       ■ false on Sun Apr 19 2020

    004. team_mood = sad

       ■ sad on Sun Apr 19 2020
       ■ concerned on Mon Apr 13 2020
       ■ happy on Thu Apr 09 2020
       ■ sad on Tue Apr 07 2020

4 meters
`.trim()
  );
});

describe("validate-expect", () => {
  test("invalid", () => {
    expect.assertions(1);
    try {
      childProcess.execSync(`node ${__dirname}/index.js expect "invalid"`, {
        env: { ...process.env, FORCE_COLOR: 0 },
      });
    } catch (error) {
      const output = error.output.toString();
      expect(output.trim()).toContain(
        `
[meter-expect: invalid ]

Parse error
    `.trim()
      );
    }
  });

  test("valid", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js expect "conversion_rate will increase by 20 in one week"`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();
    expect(output.trim()).toEqual(
      `
[meter-expect: conversion_rate will increase by 20 in one week ]

meter: conversion_rate
direction: increase_by
measure: 20 (number)
example fromDate (commit date): Mon Jun 29 2020
example deadline (calculated): Mon Jul 06 2020
    `.trim()
    );
  });
});
