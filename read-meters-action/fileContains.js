const fs = require("fs");

module.exports = (filePath, expectedContent) => {
  try {
    const actualFileContent = fs.readFileSync(filePath).toString();
    return actualFileContent.trim() === expectedContent.trim();
  } catch (error) {
    return false;
  }
};
