const path = require("path");
const fs = require("fs");

module.exports = (filePath, content) => {
  try {
    fileContent = fs
      .readFileSync(path.join(process.cwd(), filePath))
      .toString();

    return fileContent.trim() === content.trim();
  } catch (error) {
    return false;
  }
};
