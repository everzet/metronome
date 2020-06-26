const initializeTestRepository = require("./initializeTestRepository");
const scanGitHistory = require("./scanGitHistory");

let repo;
beforeEach(() => {
  repo = initializeTestRepository();
});

afterEach(() => {
  repo.destroy();
});

test("does nothing for repository without matching commits", async () => {
  repo.commit("first commit");
  repo.commit("second commit");
  const onCommit = jest.fn();
  await scanGitHistory(repo.path, onCommit);
  expect(onCommit.mock.calls.length).toBe(0);
});

test("triggers callback for commits with [meter-readings:...] in their subject", async () => {
  repo.commit("metered commit [meter-readings:prod]");

  const onCommit = jest.fn();
  await scanGitHistory(repo.path, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("readings");
  expect(theCommit.branch).toEqual("prod");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.time).toBeTruthy();
});

test("triggers callback for commits with [meter-readings] in their body", async () => {
  repo.commit("metered commit\n\n[meter-readings:test]");

  const onCommit = jest.fn();
  await scanGitHistory(repo.path, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("readings");
  expect(theCommit.branch).toEqual("test");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.time).toBeTruthy();
});

test("triggers callback for commits with [meter-expectation: ...] in their body", async () => {
  repo.commit("commit [meter-expectation: some assumption text]");

  const onCommit = jest.fn();
  await scanGitHistory(repo.path, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("expectations");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.author).toEqual("everzet");
  expect(theCommit.expectations).toEqual(["some assumption text"]);
  expect(theCommit.time).toBeTruthy();
});

test("handles commits with multiple expectations", async () => {
  repo.commit("commit\n\n[meter-expectation:one]\n[meter-expectation:two]");

  const onCommit = jest.fn();
  await scanGitHistory(repo.path, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.expectations).toEqual(["one", "two"]);
});

test("commits are processed in chronological (reverse for git log) order", async () => {
  repo.commit("commit [meter-expectation:one]");
  repo.commit("commit [meter-expectation:two]");

  const onCommit = jest.fn();
  await scanGitHistory(repo.path, onCommit);

  expect(onCommit.mock.calls.length).toBe(2);
  expect(onCommit.mock.calls[0][0].expectations).toEqual(["one"]);
  expect(onCommit.mock.calls[1][0].expectations).toEqual(["two"]);
});

test("whitespace is removed from branch and expectations", async () => {
  repo.commit("commit [meter-expectation:  one ]");
  repo.commit("commit [meter-readings: prod  ]");

  const onCommit = jest.fn();
  await scanGitHistory(repo.path, onCommit);

  expect(onCommit.mock.calls[0][0].expectations).toEqual(["one"])
  expect(onCommit.mock.calls[1][0].branch).toEqual("prod")
})
