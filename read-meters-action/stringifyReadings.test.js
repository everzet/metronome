const stringifyReadings = require("./stringifyReadings");

test("properly stringifies different reading types", () => {
  expect(stringifyReadings({ reading: 42 })).toEqual('{\n  "reading": 42\n}');
  expect(stringifyReadings({ reading: 42.3 })).toEqual(
    '{\n  "reading": 42.3\n}'
  );
  expect(stringifyReadings({ reading: true })).toEqual(
    '{\n  "reading": true\n}'
  );
  expect(stringifyReadings({ reading: false })).toEqual(
    '{\n  "reading": false\n}'
  );
  expect(stringifyReadings({ reading: "str" })).toEqual(
    '{\n  "reading": "str"\n}'
  );
});

test("null and undefined readings are ignored", () => {
  expect(stringifyReadings({ reading: null })).toEqual("{}");
  expect(stringifyReadings({ reading: undefined })).toEqual("{}");
});

test("readings stringified in consistent order", () => {
  const string1 = stringifyReadings({
    reading2: 2,
    reading1: 1,
    reading3: 5,
  });
  const string2 = stringifyReadings({
    reading1: 1,
    reading3: 5,
    reading2: 2,
  });
  const string3 = stringifyReadings({
    reading1: 1,
    reading2: 2,
    reading3: 5,
  });
  expect(string1).toEqual(string2);
  expect(string2).toEqual(string3);
});
