const catFirstFileAtRevision = require("./catFirstFileAtRevision");
const initializeTestRepository = require("./initializeTestRepository");

let repo;
beforeEach(() => {
  repo = initializeTestRepository();
});

afterEach(() => {
  repo.destroy();
});

test("shows content of an added file at a given revision", () => {
  repo.commit("add new file", "new file content");
  const file = catFirstFileAtRevision(repo.path, repo.lastCommitSha());
  expect(file.path).toEqual("file");
  expect(file.content).toEqual("new file content");
});

test("shows full content of a changed file at a given revision", () => {
  repo.commit("add new file", "new file content");
  repo.commit("add new file", "new file content\nsecond string");
  const file = catFirstFileAtRevision(repo.path, repo.lastCommitSha());
  expect(file.path).toEqual("file");
  expect(file.content).toEqual("new file content\nsecond string");
});

test("returns first file if multiple changed", () => {
  repo.commit("add new files", ["content1", "content2"]);
  const file = catFirstFileAtRevision(repo.path, repo.lastCommitSha());
  expect(file.path).toEqual("file1");
  expect(file.content).toEqual("content1");
});
