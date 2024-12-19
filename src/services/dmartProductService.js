import puppeteer from "puppeteer";
import { DMART_CONFIG, DMART_SELECTORS } from "../config/config.js";
import {
  writeJsonFile,
  delay,
  fileExists,
  readJsonFile,
} from "../utils/fileUtils.js";

export class DmartProductService {
  async scrapeProducts(categories) {
    // Check if products file already exists and load existing data
    let existingProducts = {};
    if (await fileExists(DMART_CONFIG.PRODUCTS_FILE)) {
      existingProducts = await readJsonFile(DMART_CONFIG.PRODUCTS_FILE);
    }

    const browser = await puppeteer.launch({
      ...DMART_CONFIG.BROWSER_CONFIG,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      // Block unnecessary resources for faster loading
      page.on("request", (req) => {
        if (["stylesheet", "font", "media"].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      const allProducts = { ...existingProducts };

      for (const category of categories.catArray) {
        if (allProducts[category.name]) {
          continue;
        }

        const categoryProducts = await this.scrapeCategoryProducts(
          page,
          category
        );

        if (categoryProducts.length > 0) {
          allProducts[category.name] = categoryProducts;
          console.log(
            `✅ Scraped ${categoryProducts.length} products from ${category.name}`
          );
          // Save after each category in case of interruption
          writeJsonFile(DMART_CONFIG.PRODUCTS_FILE, allProducts);
        } else {
          console.log(`⚠️ No products found in ${category.name}`);
        }

        await delay(DMART_CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      console.log("All products saved to", DMART_CONFIG.PRODUCTS_FILE);
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
        `${DMART_CONFIG.BASE_URL}/category/${category.seoToken}`,
        {
          waitUntil: "networkidle0",
        }
      );

      await page.waitForSelector(DMART_SELECTORS.PRODUCT_GRID);
      await delay(2000); // Add initial delay for content load

      let products = [];
      let lastScrollHeight = 0;
      let noNewScrollCount = 0;
      const maxNoNewScrollAttempts = 1;

      while (noNewScrollCount < maxNoNewScrollAttempts) {
        // Scroll to bottom of page
        const currentScrollHeight = await page.evaluate(async () => {
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return document.body.scrollHeight;
        });

        if (currentScrollHeight === lastScrollHeight) {
          noNewScrollCount++;
        } else {
          noNewScrollCount = 0;
          lastScrollHeight = currentScrollHeight;
        }

        await delay(1000);
        products = await this.extractProducts(page, category.name);
        console.log(`Found ${products.length} products so far...`);
      }

      console.log(
        `✅ Finished scraping ${category.name} with ${products.length} products`
      );
      return products;
    } catch (error) {
      console.error(`Error scraping category ${category.name}:`, error.message);
      return [];
    }
  }

  async extractProducts(page, categoryName) {
    return await page.evaluate(
      (selectors, category) => {
        const products = [];
        const productGrids = document.querySelectorAll(selectors.PRODUCT_GRID);

        productGrids.forEach((productGrid, index) => {
          try {
            const name = productGrid.querySelector(
              selectors.PRODUCT_NAME
            )?.textContent;
            const image = productGrid.querySelector(
              selectors.PRODUCT_IMAGE
            )?.src;
            const currentPrice = Number(
              productGrid.querySelector(selectors.PRODUCT_CURRENT_PRICE)
                ?.textContent
            );
            const actualPrice = Number(
              productGrid.querySelector(selectors.PRODUCT_ACTUAL_PRICE)
                ?.textContent
            );
            const variant = productGrid
              .querySelector(selectors.PRODUCT_VARIANT)
              ?.textContent.trim();

            if (name && image && currentPrice) {
              // Create unique ID by combining category, name and variant
              const id = `${category}_${name}_${variant}`
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "_");

              products.push({
                id,
                name,
                image,
                currentPrice,
                actualPrice,
                variant,
              });
            }
          } catch (error) {
            console.log("Error parsing product:", error.message);
          }
        });

        return products;
      },
      DMART_SELECTORS,
      categoryName
    );
  }
}
