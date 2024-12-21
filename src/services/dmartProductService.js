import puppeteer from "puppeteer";
import { DMART_CONFIG, DMART_SELECTORS } from "../config/config.js";
import { delay } from "../utils/fileUtils.js";
import { connectDB } from "../utils/dbUtils.js";
import { upsertProduct } from "../utils/productUtils.js";

export class DmartProductService {
  async scrapeProducts(categories) {
    // Connect to MongoDB
    await connectDB();

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

      for (const category of categories.catArray) {
        const categoryProducts = await this.scrapeCategoryProducts(
          page,
          category
        );

        if (categoryProducts.length > 0) {
          console.log(
            `✅ Scraped ${categoryProducts.length} products from ${category.name}`
          );
        } else {
          console.log(`⚠️ No products found in ${category.name}`);
        }

        await delay(DMART_CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      console.log("Finished scraping all products");
      return true;
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
      await delay(2000);

      let processedProducts = [];
      let lastScrollHeight = 0;
      let noNewScrollCount = 0;
      const maxNoNewScrollAttempts = 1;

      while (noNewScrollCount < maxNoNewScrollAttempts) {
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
        const products = await this.extractProducts(page, category.name);

        // Save each product to MongoDB
        for (const product of products) {
          if (!processedProducts.includes(product.id)) {
            await upsertProduct(
              {
                ...product,
                category: category.name,
              },
              "D-Mart"
            );
            processedProducts.push(product.id);
          }
        }

        console.log(`Processed ${processedProducts.length} products so far...`);
      }

      console.log(
        `✅ Finished scraping ${category.name} with ${processedProducts.length} products`
      );
      return processedProducts;
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
            const currentPrice = productGrid.querySelector(
              selectors.PRODUCT_CURRENT_PRICE
            )?.textContent;
            const actualPrice = productGrid.querySelector(
              selectors.PRODUCT_ACTUAL_PRICE
            )?.textContent;
            const variant = productGrid
              .querySelector(selectors.PRODUCT_VARIANT)
              ?.textContent.trim();

            const outOfStock = document.querySelector(
              selectors.PRODUCT_OUT_OF_STOCK
            );

            const available = outOfStock ? true : false;
            // Create unique ID by combining category, name and variant
            const id = `${category}_${name}_${variant}`
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "_");

            if (name && image && currentPrice) {
              products.push({
                id,
                name,
                image,
                platform: "D-Mart",
                currentPrice,
                actualPrice,
                variant,
                available,
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
