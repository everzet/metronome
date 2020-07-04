const catFirstFileAtRevision = require("./catFirstFileAtRevision");
const initializeTestRepository = require("./initializeTestRepository");

let repo;
beforeEach(() => {
  repo = initializeTestRepository();
});

afterEach(() => {
  repo.destroy();
});

test("shows content of an added file at a given revision", async () => {
  const sha = repo.commit("add new file", { contents: "new file content" });
  const file = await catFirstFileAtRevision(repo.path, sha);
  expect(file.path).toEqual("file");
  expect(file.content).toEqual("new file content");
});

test("shows full content of a changed file at a given revision", async () => {
  repo.commit("add new file", { contents: "new file content" });
  const sha = repo.commit("add new file", {
    contents: "new file content\nsecond string",
  });
  const file = await catFirstFileAtRevision(repo.path, sha);
  expect(file.path).toEqual("file");
  expect(file.content).toEqual("new file content\nsecond string");
});

test("returns first file if multiple changed", async () => {
  const sha = repo.commit("add new files", {
    contents: ["content1", "content2"],
  });
  const file = await catFirstFileAtRevision(repo.path, sha);
  expect(file.path).toEqual("file1");
  expect(file.content).toEqual("content1");
});
