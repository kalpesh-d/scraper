import puppeteer from "puppeteer";
import { ZEPTO_CONFIG, ZEPTO_SELECTORS } from "../config/config.js";
import {
  fileExists,
  readJsonFile,
  writeJsonFile,
  delay,
} from "../utils/fileUtils.js";

export class ZeptoCategoryService {
  async fetchCategories() {
    if (fileExists(ZEPTO_CONFIG.CATEGORIES_FILE)) {
      const existingData = readJsonFile(ZEPTO_CONFIG.CATEGORIES_FILE);
      if (existingData) {
        console.log(
          "✔ Zepto categories data already exists, skipping scraping"
        );
        return existingData;
      }
    }

    const browser = await puppeteer.launch(ZEPTO_CONFIG.BROWSER_CONFIG);
    try {
      const page = await browser.newPage();
      await page.goto(ZEPTO_CONFIG.CATEGORIES_URL, {
        waitUntil: "networkidle0",
      });

      // Click on detect location button
      await page.waitForSelector(ZEPTO_SELECTORS.DETECT_LOCATION_BUTTON);
      await page.click(ZEPTO_SELECTORS.DETECT_LOCATION_BUTTON);

      // Type location
      await page.waitForSelector(ZEPTO_SELECTORS.LOCATION_INPUT);
      await page.type(ZEPTO_SELECTORS.LOCATION_INPUT, ZEPTO_CONFIG.LOCATION);

      await delay(2000); // Wait for suggestions to load

      // Click on the first location suggestion
      await page.waitForSelector(ZEPTO_SELECTORS.LOCATION_SUGGESTION_CONTAINER);
      const locationSuggestions = await page.$$(
        ZEPTO_SELECTORS.LOCATION_SUGGESTION_CONTAINER
      );
      if (locationSuggestions.length > 0) {
        await locationSuggestions[0].click();
      }

      // Click confirm location button
      await page.waitForSelector(ZEPTO_SELECTORS.CONFIRM_LOCATION_BUTTON);
      await page.click(ZEPTO_SELECTORS.CONFIRM_LOCATION_BUTTON);

      // Wait for categories to load
      await delay(2000);

      console.log("✔ Successfully set up location for Zepto");

      // Extract categories
      await page.waitForSelector(ZEPTO_SELECTORS.CATEGORY_LINK);
      const categories = await page.evaluate(() => {
        const categoryLinks = document.querySelectorAll("a.contents");
        return Array.from(categoryLinks).map((link) => {
          const img = link.querySelector("img");
          return {
            name: img ? img.alt : "",
            url: link.href,
          };
        });
      });

      console.log(`✅ Found ${categories.length} categories`);

      // Filter out any categories without names or URLs
      const validCategories = categories.filter(
        (category) => category.name && category.url
      );

      const categoriesData = { categories: validCategories };
      writeJsonFile(ZEPTO_CONFIG.CATEGORIES_FILE, categoriesData);
      return categoriesData;
    } catch (error) {
      console.error("Error fetching Zepto categories:", error.message);
      return null;
    } finally {
      await browser.close();
    }
  }
}
