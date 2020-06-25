const fs = require("fs");
const childProcess = require("child_process");
const scanGitHistory = require("./scanGitHistory");

let repo;

beforeEach(() => {
  repo = fs.mkdtempSync("scanGitHistoryTest");
  gitInit(repo);
});

afterEach(() => {
  fs.rmdirSync(repo, { recursive: true });
});

test("does nothing for repository without matching commits", async () => {
  gitCommit(repo, "first commit");
  gitCommit(repo, "second commit");
  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);
  expect(onCommit.mock.calls.length).toBe(0);
});

test("triggers callback for commits with [meter-readings] in their subject", async () => {
  gitCommit(repo, "metered commit [meter-readings]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("readings");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.time).toBeTruthy();
});

test("triggers callback for commits with [meter-readings] in their body", async () => {
  gitCommit(repo, "metered commit\\n\\n[meter-readings]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("readings");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.time).toBeTruthy();
});

test("triggers callback for commits with [meter-expectation: ...] in their body", async () => {
  gitCommit(repo, "commit [meter-expectation: some assumption text]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.type).toEqual("expectations");
  expect(theCommit.sha).toMatch(/[0-9a-f]{40}/);
  expect(theCommit.author).toEqual("everzet");
  expect(theCommit.expectations).toEqual(["some assumption text"]);
  expect(theCommit.time).toBeTruthy();
});

test("handles commits with multiple expectations", async () => {
  gitCommit(repo, "commit\\n\\n[meter-expectation:one]\\n[meter-expectation:two]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(1);
  const theCommit = onCommit.mock.calls[0][0];

  expect(theCommit.expectations).toEqual(["one", "two"]);
});

test("commits are processed in chronological (reverse for git log) order", async () => {
  gitCommit(repo, "commit [meter-expectation:one]");
  gitCommit(repo, "commit [meter-expectation:two]");

  const onCommit = jest.fn();
  await scanGitHistory(repo, onCommit);

  expect(onCommit.mock.calls.length).toBe(2);
  expect(onCommit.mock.calls[0][0].expectations).toEqual(["one"]);
  expect(onCommit.mock.calls[1][0].expectations).toEqual(["two"]);
});

const gitInit = (repo) => {
  childProcess.execSync("git init", { cwd: repo });
  childProcess.execSync('git config user.name "everzet"', { cwd: repo });
  childProcess.execSync('git config user.email "me@me.com"', { cwd: repo });
  gitCommit(repo, "initial commit");
};

const gitCommit = (repo, message) => {
  fs.writeFileSync(`${repo}/file`, `${Math.random()}`);
  childProcess.execSync("git add .", { cwd: repo });
  childProcess.execSync(`git commit -m "${message}"`, { cwd: repo });
};
