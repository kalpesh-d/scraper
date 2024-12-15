import puppeteer from "puppeteer";
import { SCRAPER_CONFIG, SELECTORS } from "../config/config.js";
import {
  writeJsonFile,
  delay,
  fileExists,
  readJsonFile,
} from "../utils/fileUtils.js";

export class ProductService {
  async scrapeProducts(categories) {
    // Check if products data already exists
    if (fileExists(SCRAPER_CONFIG.PRODUCTS_FILE)) {
      const existingData = readJsonFile(SCRAPER_CONFIG.PRODUCTS_FILE);
      if (existingData) {
        console.log("✔ Products data already exists, skipping scraping");
        return existingData;
      }
    }

    const browser = await puppeteer.launch(SCRAPER_CONFIG.BROWSER_CONFIG);
    const allProducts = {};

    try {
      const page = await browser.newPage();

      for (const category of categories.catArray) {
        const categoryProducts = await this.scrapeCategoryProducts(
          page,
          category
        );

        if (categoryProducts.length > 0) {
          allProducts[category.name] = categoryProducts;
          console.log(
            `✅ Scraped ${categoryProducts.length} products from ${category.name}`
          );
        } else {
          console.log(`⚠️ No products found in ${category.name}`);
        }

        await delay(SCRAPER_CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      writeJsonFile(SCRAPER_CONFIG.PRODUCTS_FILE, allProducts);
      console.log("All products saved to", SCRAPER_CONFIG.PRODUCTS_FILE);
      return allProducts;
    } catch (error) {
      console.error("Error scraping products:", error.message);
      return null;
    } finally {
      await browser.close();
    }
  }

  async scrapeCategoryProducts(page, category) {
    try {
      console.log(`Scraping products for category: ${category.name}`);
      await page.goto(
        `${SCRAPER_CONFIG.BASE_URL}/category/${category.seoToken}`,
        {
          waitUntil: "networkidle0",
        }
      );

      // Wait for initial products to load
      await page.waitForSelector(SELECTORS.PRODUCT_GRID);

      // Keep scrolling and collecting products until no new products are found
      let previousHeight = 0;
      let products = [];
      let attempts = 0;
      const maxAttempts = 50; // Safety limit to prevent infinite loops

      while (attempts < maxAttempts) {
        // Scroll to bottom
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        );
        await delay(1000); // Wait for new content to load

        // Get current scroll height
        const currentHeight = await page.evaluate(
          () => document.body.scrollHeight
        );

        // Get current products
        const currentProducts = await this.extractProducts(page);

        console.log(
          `✔ Found ${currentProducts.length} products so far in ${category.name}`
        );

        // If no new products and scroll height hasn't changed, we've reached the end
        if (
          currentHeight === previousHeight ||
          currentProducts.length === products.length
        ) {
          if (attempts > 2) {
            // Check a few more times to ensure we've really reached the end
            products = currentProducts;
            break;
          }
        } else {
          previousHeight = currentHeight;
          products = currentProducts;
          attempts = 0; // Reset attempts if we found new products
          continue;
        }

        attempts++;
      }

      return products;
    } catch (error) {
      console.error(`Error scraping category ${category.name}:`, error.message);
      return [];
    }
  }

  async extractProducts(page) {
    return await page.evaluate((selectors) => {
      const products = [];
      const productGrids = document.querySelectorAll(selectors.PRODUCT_GRID);

      productGrids.forEach((productGrid) => {
        try {
          const name = productGrid.querySelector(
            selectors.PRODUCT_NAME
          )?.textContent;
          const image = productGrid.querySelector(selectors.PRODUCT_IMAGE)?.src;
          const price = Number(
            productGrid.querySelector(selectors.PRODUCT_PRICE)?.textContent
          );
          const savePrice = Number(
            productGrid.querySelector(selectors.PRODUCT_SAVE_PRICE)?.textContent
          );
          const variant = productGrid
            .querySelector(selectors.PRODUCT_VARIANT)
            ?.textContent.trim();

          if (name && image && price) {
            products.push({
              name,
              image,
              price,
              savePrice,
              off: savePrice ? price - savePrice : 0,
              variant,
            });
          }
        } catch (error) {
          console.log("Error parsing product:", error.message);
        }
      });

      return products;
    }, SELECTORS);
  }
}
