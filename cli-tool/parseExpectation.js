const chrono = require("chrono-node");

const EXPECTATION_REGEX = /^(?<metric>[a-zA-Z_]+(?:[a-zA-Z_0-9])?)\s+(?:will\s+)?(?<direction>(?:\+|\-|\~|increases? by|decreases? by|increases? to|decreases? to|is|to be|becomes?|stays? at|stays? around))?\s*(?<measure>(?:[0-9]+(?:\.[0-9]+)?\s*(?:\%|percent)|[0-9]+(?:\.[0-9]+)?|true|false|\"[^\"]+\"))\s+(?<timeline>.*)$/i;

module.exports = (expectation, fromDate) => {
  const match = expectation.match(EXPECTATION_REGEX);
  if (!match) return null;

  const { groups } = match;

  return {
    metric: groups.metric,
    direction: parseDirection(groups.direction),
    measure: parseMeasure(groups.measure),
    fromDate,
    deadline: parseTimeline(groups.timeline, fromDate),
  };
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
      regex: /^(?<value>true|false)$/i,
      unit: "boolean",
    },
    {
      regex: /^\"(?<value>[^\"]+)\"$/i,
      unit: "string",
    },
    {
      regex: /^(?<value>[0-9]+(?:\.[0-9]+)?)$/i,
      unit: "number",
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

const parseTimeline = (timeline, fromDate) =>
  chrono.parseDate(timeline, fromDate);
