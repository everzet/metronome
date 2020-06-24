const fs = require("fs");

module.exports = (path, content) => {
  try {
    fileContent = fs.readFileSync(`./${path}`).toString();
    return fileContent.trim() === content.trim();
  } catch (error) {
    return false;
  }
};
