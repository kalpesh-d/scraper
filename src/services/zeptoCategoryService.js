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

      // First get all categories
      await page.waitForSelector(ZEPTO_SELECTORS.CATEGORY_LINK);
      const categories = await page.evaluate(() => {
        const categoryLinks = document.querySelectorAll("a.contents");
        return Array.from(categoryLinks).map((link) => {
          const img = link.querySelector("img");
          return {
            name: img ? img.alt : "",
            url: link.href,
            subcategories: [],
          };
        });
      });

      // Now visit each category page and get subcategories
      for (const category of categories) {
        console.log(`Fetching subcategories for ${category.name}...`);
        await page.goto(category.url, { waitUntil: "networkidle0" });
        await delay(2000); // Wait for subcategories to load

        // Extract subcategories
        const subcategories = await page.evaluate((selectors) => {
          const container = document.querySelector(
            selectors.SUBCATEGORY_CONTAINER
          );
          if (!container) return [];

          const items = container.querySelectorAll(selectors.SUBCATEGORY_ITEM);
          return Array.from(items).map((item) => {
            const id = item.id.replace("sub-catgory-item-", "");
            const nameElement = item.querySelector(selectors.SUBCATEGORY_NAME);
            return {
              id: id,
              name: nameElement ? nameElement.textContent.trim() : "",
            };
          });
        }, ZEPTO_SELECTORS);

        category.subcategories = subcategories;
        console.log(
          `✅ Found ${subcategories.length} subcategories in ${category.name}`
        );

        await delay(ZEPTO_CONFIG.DELAY_BETWEEN_REQUESTS); // Delay between requests
      }

      console.log(`✅ Found ${categories.length} categories in total`);

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
