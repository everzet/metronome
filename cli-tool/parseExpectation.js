const chrono = require("chrono-node");

const EXPECTATION_REGEX = /^(?<metric>[a-zA-Z_]+(?:[a-zA-Z_0-9])?)\s+(?:will\s+)?(?<direction>(?:\+|\-|\~|increases? by|decreases? by|increases? to|decreases? to|is|to be|becomes?|stays? at|stays? around))?\s*(?<measure>(?:[0-9]+(?:\.[0-9]+)?\s*(?:\%|percent)|[0-9]+(?:\.[0-9]+)?|true|false|\'[^\']+\'|\"[^\"]+\"))\s+(?<timeline>.*)$/i;

module.exports = (string, fromDate) => {
  const match = string.match(EXPECTATION_REGEX);
  if (!match) return { ok: false, error: "Parse error" };

  const { groups } = match;
  const expectation = {
    metric: groups.metric,
    direction: parseDirection(groups.direction),
    measure: parseMeasure(groups.measure),
    fromDate,
    deadline: parseTimeline(groups.timeline, fromDate),
  };

  return validateExpectation(expectation);
};

const validateExpectation = (expectation) => {
  if (!expectation.direction || !expectation.measure || !expectation.deadline) {
    return { ok: false, expectation, error: "Some details failed parsing" };
  }

  if (
    expectation.measure.unit === "boolean" &&
    expectation.direction !== "maintain" &&
    expectation.direction !== "become"
  ) {
    return {
      ok: false,
      expectation,
      error: `Booleans can only be used with 'maintain' or 'become' modifiers, but '${expectation.direction}' was given`,
    };
  }

  if (
    expectation.measure.unit === "string" &&
    expectation.direction !== "maintain" &&
    expectation.direction !== "become"
  ) {
    return {
      ok: false,
      expectation,
      error: `Strings can only be used with 'maintain' or 'become' modifiers, but '${expectation.direction}' was given`,
    };
  }

  if (expectation.deadline <= expectation.fromDate) {
    return {
      ok: false,
      expectation,
      error: "Expectation deadlines can not be set in the past",
    };
  }

  return { ok: true, expectation };
};

const parseDirection = (direction) => {
  switch (direction) {
    case "+":
    case "increase by":
    case "increases by":
      return "increase_by";
    case "-":
    case "decrease by":
    case "decreases by":
      return "decrease_by";
    case "increase to":
    case "increases to":
      return "increase_to";
    case "decrease to":
    case "decreases to":
      return "decrease_to";
    case "~":
    case "stay":
    case "stays":
    case "stay at":
    case "stays at":
    case "stay around":
    case "stays around":
      return "maintain";
    case "is":
    case "to be":
    case "become":
    case "becomes":
    default:
      return "become";
  }
};

const parseMeasure = (measure) => {
  const patterns = [
    {
      regex: /^(?<value>[0-9]+(?:\.[0-9]+)?)\s*(?:percent|\%)$/i,
      unit: "percent",
    },
    {
      regex: /^(?<value>[0-9]+(?:\.[0-9]+)?)$/i,
      unit: "number",
    },
    {
      regex: /^(?<value>true|false)$/i,
      unit: "boolean",
    },
    {
      regex: /^\"(?<value>[^\"]+)\"$/i,
      unit: "string",
    },
    {
      regex: /^\'(?<value>[^\']+)\'$/i,
      unit: "string",
    },
  ];

  for (const { regex, unit } of patterns) {
    const match = measure.match(regex);
    if (match) {
      const { value } = match.groups;
      switch (unit) {
        case "boolean":
          return { unit, value: value === "true" };
        case "string":
          return { unit, value };
        case "percent":
        case "number":
          return { unit, value: parseFloat(value) };
      }
    }
  }

  return null;
};

const parseTimeline = (timeline, fromDate) => {
  const [result] = chrono.parse(timeline, fromDate);
  if (!result) return null;

  result.start.assign("timezoneOffset", 0);
  return result.start.date();
};
