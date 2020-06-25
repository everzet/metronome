const fs = require("fs");
const childProcess = require("child_process");
const scanGitHistory = require("./scanGitHistory");

let repo;

beforeEach(() => {
  repo = fs.mkdtempSync("scanGitHistoryTest");
  childProcess.execSync("git init", { cwd: repo });
  commit(repo, "initial commit");
});

afterEach(() => {
  fs.rmdirSync(repo, { recursive: true });
});

test("does nothing for repository without matching commits", async () => {
  commit(repo, "first commit");
  commit(repo, "second commit");
  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);
  expect(onCommit.mock.calls.length).toBe(0);
});

test("triggers callback for commits with [meter-readings] in their subject", async () => {
  commit(repo, "metered commit [meter-readings]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("readings");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.time).toBeTruthy();
});

test("triggers callback for commits with [meter-readings] in their body", async () => {
  commit(repo, "metered commit\\n\\n[meter-readings]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("readings");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.time).toBeTruthy();
});

test("triggers callback for commits with [meter-expectation: ...] in their body", async () => {
  commit(repo, "commit [meter-expectation: some assumption text]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("expectations");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.author).toBeTruthy();
  expect(theCommit.time).toBeTruthy();
  expect(theCommit.expectations).toEqual(["some assumption text"]);
});

test("handles commits with multiple expectations", async () => {
  commit(repo, "commit\\n\\n[meter-expectation:one]\\n[meter-expectation:two]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.expectations).toEqual(["one", "two"]);
});

const commit = (repo, message) => {
  fs.writeFileSync(`${repo}/file`, `${Math.random()}`);
  childProcess.execSync("git add .", { cwd: repo });
  childProcess.execSync(`git commit -m "${message}"`, { cwd: repo });
};
