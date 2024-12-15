import fs from "fs";
import path from "path";

const ensureDirectoryExists = (filePath) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

export const readJsonFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return fileContent && fileContent.trim() !== ""
      ? JSON.parse(fileContent)
      : null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
};

export const writeJsonFile = (filePath, data) => {
  try {
    ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    return false;
  }
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
