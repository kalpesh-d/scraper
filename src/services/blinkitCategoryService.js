import puppeteer from "puppeteer";
import { BLINKIT_CONFIG, BLINKIT_SELECTORS } from "../config/config.js";
import {
  fileExists,
  readJsonFile,
  writeJsonFile,
  delay,
} from "../utils/fileUtils.js";

export class BlinkitCategoryService {
  async fetchCategories() {
    if (fileExists(BLINKIT_CONFIG.CATEGORIES_FILE)) {
      const existingData = readJsonFile(BLINKIT_CONFIG.CATEGORIES_FILE);
      if (existingData) {
        console.log(
          "✔ Blinkit categories data already exists, skipping scraping"
        );
        return existingData;
      }
    }

    const browser = await puppeteer.launch(BLINKIT_CONFIG.BROWSER_CONFIG);
    try {
      const page = await browser.newPage();

      await page.goto(BLINKIT_CONFIG.BASE_URL, {
        waitUntil: "networkidle0",
      });

      await page.waitForSelector(BLINKIT_SELECTORS.PINCODE_INPUT);
      await page.type(BLINKIT_SELECTORS.PINCODE_INPUT, BLINKIT_CONFIG.PINCODE);

      await page.waitForSelector(BLINKIT_SELECTORS.PINCODE_SELECT);
      await delay(1000);

      await page.click(BLINKIT_SELECTORS.PINCODE_SELECT);

      await delay(2000);

      await page.goto(BLINKIT_CONFIG.CATEGORIES_URL, {
        waitUntil: "domcontentloaded",
      });

      await page.waitForSelector(BLINKIT_SELECTORS.CATEGORY_CONTAINER);

      const categories = await this.extractCategories(page);
      console.log(`✅ Found ${Object.keys(categories).length} categories`);

      writeJsonFile(BLINKIT_CONFIG.CATEGORIES_FILE, { categories });
      return { categories };
    } catch (error) {
      console.error("Error fetching Blinkit categories:", error.message);
      return null;
    } finally {
      await browser.close();
    }
  }

  async extractCategories(page) {
    return await page.evaluate((selectors) => {
      const categories = {};

      const headers = document.querySelectorAll(
        `${selectors.CATEGORY_CONTAINER} h2`
      );

      headers.forEach((header) => {
        try {
          const linksContainer = header.nextElementSibling;
          if (
            linksContainer &&
            linksContainer.classList.contains(
              selectors.CATEGORY_LINKS_CONTAINER
            )
          ) {
            const links = linksContainer.querySelectorAll(
              selectors.CATEGORY_LINK
            );

            const categoryName = header.textContent.trim();
            const subCategories = Array.from(links).map((link) => ({
              name: link.textContent.trim(),
              url: link.href,
            }));

            if (subCategories.length > 0) {
              categories[categoryName] = subCategories;
            }
          }
        } catch (error) {
          console.log("Error fetching categories:", error.message);
        }
      });

      return categories;
    }, BLINKIT_SELECTORS);
  }
}
