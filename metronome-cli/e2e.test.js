const childProcess = require("child_process");
const initializeTestRepository = require("./initializeTestRepository");

let repo;
let shas = [];
let secondExpectationCommitSha;
let secondToLastReadingsCommitSha;
beforeAll(() => {
  repo = initializeTestRepository({
    date: "2018-06-26 00:00",
  });

  // create readings
  repo.commit("[meter-readings:prod]", {
    contents: `
{
  "net_promoter_score": 3,
  "desktop_conversion_rate": 1.2,
  "team_mood": "unhappy"
}
  `,
    date: "2018-06-26 00:00",
  });
  shas.push(repo.lastCommitSha());

  // set first expectation
  repo.commit(
    "Remove extra step in the checkout\n\n[meter-expect: desktop_conversion_rate will increase by 30% in 2 weeks ]",
    { date: "2018-06-27 00:00" }
  );
  shas.push(repo.lastCommitSha());

  // set second expectation
  repo.commit(
    "Rework refund UI\n\n[meter-expect: net_promoter_score will increase to 8 in 1 month ]",
    { date: "2018-06-28 00:00" }
  );
  secondExpectationCommitSha = repo.lastCommitSha();
  shas.push(repo.lastCommitSha());

  // set third expectation
  repo.commit(
    `Increase test coverage\n\n[meter-expect: team_mood will become 'happy' in 2 weeks ]`,
    { date: "2018-06-29 00:00" }
  );
  shas.push(repo.lastCommitSha());

  // update readings
  repo.commit("[meter-readings:prod]", {
    contents: `
{
  "net_promoter_score": 4,
  "desktop_conversion_rate": 1.6,
  "team_mood": "concerned"
}
  `,
    date: "2018-07-05 00:00",
  });
  secondToLastReadingsCommitSha = repo.lastCommitSha();
  shas.push(repo.lastCommitSha());

  // update readings
  repo.commit("[meter-readings:prod]", {
    contents: `
{
  "net_promoter_score": 6,
  "desktop_conversion_rate": 1.65,
  "team_mood": "concerned"
}
  `,
    date: "2018-07-14 00:00",
  });
  shas.push(repo.lastCommitSha());
});

afterAll(() => {
  repo.destroy();
});

describe("check", () => {
  test("default", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js check ${repo.path} --format basic`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
✓ desktop_conversion_rate will increase by 30% in 2 weeks
✕ team_mood will become 'happy' in 2 weeks
? net_promoter_score will increase to 8 in 1 month
`.trim()
    );
  });

  test("--from", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js check ${repo.path} --from ${secondExpectationCommitSha} --format basic`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(`✕ team_mood will become 'happy' in 2 weeks`);
  });

  test("--to", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js check ${repo.path} --to ${secondToLastReadingsCommitSha} --format basic`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
? desktop_conversion_rate will increase by 30% in 2 weeks
? net_promoter_score will increase to 8 in 1 month
? team_mood will become 'happy' in 2 weeks
`.trim()
    );
  });

  test("--env", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js check ${repo.path} --env test --format basic`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
? desktop_conversion_rate will increase by 30% in 2 weeks
? net_promoter_score will increase to 8 in 1 month
? team_mood will become 'happy' in 2 weeks
`.trim()
    );
  });

  test("--format pretty", () => {
    const output = childProcess
      .execSync(
        `node ${__dirname}/index.js check ${repo.path} --format pretty`,
        {
          env: { ...process.env, FORCE_COLOR: 0 },
        }
      )
      .toString();

    expect(output.trim()).toEqual(
      `
[✓] ${shas[1].slice(0, 7)} Remove extra step in the checkout
            desktop_conversion_rate will increase by 30% in 2 weeks
            @everzet on Wed Jun 27 2018

        1.60 ┤                                                 ╭${' '}
        1.50 ┤                                                 │${' '}
        1.40 ┤                                                 │${' '}
        1.30 ┤                                                 │${' '}
        1.20 ┼─────────────────────────────────────────────────╯${' '}
`.trim()
    );
  });
});
