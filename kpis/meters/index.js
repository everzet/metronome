const fetch = require("node-fetch");

module.exports.monthly_downloads = async () => {
  const res = await fetch(
    "https://api.npmjs.org/downloads/point/last-month/@everzet/metronome-cli"
  );
  const json = await res.json();

  return json.downloads;
};
