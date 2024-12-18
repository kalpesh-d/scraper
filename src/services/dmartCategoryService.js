import puppeteer from "puppeteer";
import { DMART_CONFIG } from "../config/config.js";
import { fileExists, readJsonFile, writeJsonFile } from "../utils/fileUtils.js";

export class DmartCategoryService {
  async fetchCategories() {
    if (fileExists(DMART_CONFIG.CATEGORIES_FILE)) {
      const existingData = readJsonFile(DMART_CONFIG.CATEGORIES_FILE);
      if (existingData) {
        console.log("✔ Categories data already exists, skipping scraping");
        return existingData;
      }
    }

    const browser = await puppeteer.launch(DMART_CONFIG.BROWSER_CONFIG);
    try {
      const page = await browser.newPage();
      const response = await page.goto(DMART_CONFIG.CATEGORIES_API, {
        waitUntil: "networkidle0",
      });

      const jsonData = await response.json();
      const filteredData = this.filterCategoryData(jsonData);

      writeJsonFile(DMART_CONFIG.CATEGORIES_FILE, filteredData);
      return filteredData;
    } catch (error) {
      console.error("Error fetching categories:", error.message);
      return null;
    } finally {
      await browser.close();
    }
  }

  filterCategoryData(jsonData) {
    return {
      totalRecords: jsonData.totalRecords,
      defaultzip: jsonData.defaultzip,
      catArray: jsonData.catArray.map((category) => ({
        name: category.name,
        seoToken: category.seoToken,
        uniqueId: category.uniqueId,
        fullImage: category.fullImage,
        thumbnail: category.thumbnail,
      })),
    };
  }
}
