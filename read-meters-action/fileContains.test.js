const fs = require("fs");
const fileContains = require("./fileContains");

test("returns false if given file does not exist", () => {
  expect(fileContains("./inexistent_file", "")).toEqual(false)
});

test("returns true if given file contains given text", () => {
  const actualContent = fs.readFileSync(__filename).toString();
  expect(fileContains(__filename, actualContent)).toEqual(true)
});

test("ignores trailing whitespace in comparison", () => {
  const actualContent = fs.readFileSync(__filename).toString();
  expect(fileContains(__filename, `\n${actualContent}\n`)).toEqual(true)
});

test("returns false if given file contains different to given text", () => {
  expect(fileContains(__filename, "")).toEqual(false)
});
