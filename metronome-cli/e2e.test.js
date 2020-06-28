const childProcess = require("child_process");
const initializeTestRepository = require("./initializeTestRepository");

let repo;
beforeEach(() => {
  repo = initializeTestRepository({
    date: "2018-06-26 00:00",
  });
});

afterEach(() => {
  repo.destroy();
});

test("repository analysis", () => {
  // create metrics file
  repo.commit("[meter-readings:master]", {
    contents: `
{
  "net_promoter_score": 3,
  "desktop_conversion_rate": 1.2,
  "employee_feeling": "unhappy"
}
  `,
    date: "2018-06-26 00:00",
  });
  // set first expectation
  repo.commit(
    "[meter-expect: desktop_conversion_rate will increase by 30% in 2 weeks ]",
    { date: "2018-06-27 00:00" }
  );
  // set second expectation
  repo.commit(
    "[meter-expect: net_promoter_score will increase to 8 in 1 month ]",
    { date: "2018-06-28 00:00" }
  );
  // set third expectation
  repo.commit(
    `[meter-expect: employee_feeling will become 'happy' in 2 weeks ]`,
    { date: "2018-06-29 00:00" }
  );
  // update metrics file
  repo.commit("[meter-readings:master]", {
    contents: `
{
  "net_promoter_score": 4,
  "desktop_conversion_rate": 1.6,
  "employee_feeling": "concerned"
}
  `,
    date: "2018-07-05 00:00",
  });
  // update metrics file
  repo.commit("[meter-readings:master]", {
    contents: `
{
  "net_promoter_score": 6,
  "desktop_conversion_rate": 1.65,
  "employee_feeling": "concerned"
}
  `,
    date: "2018-07-14 00:00",
  });

  // run analysis
  const output = childProcess
    .execSync(`node ${__dirname}/index.js check`, {
      cwd: repo.path,
      env: { ...process.env, FORCE_COLOR: 0 },
    })
    .toString()
    .trim();

  expect(output).toEqual(
    `
Successful:
  - desktop_conversion_rate will increase by 30% in 2 weeks

Failed:
  - employee_feeling will become 'happy' in 2 weeks

In progress:
  - net_promoter_score will increase to 8 in 1 month
`.trim()
  );
});
