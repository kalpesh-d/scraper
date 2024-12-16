import puppeteer from "puppeteer";
import { BLINKIT_CONFIG } from "../config/config.js";
import {
  fileExists,
  readJsonFile,
  writeJsonFile,
  delay,
} from "../utils/fileUtils.js";

export class BlinkitProductService {
  async scrapeProducts(categories) {
    const browser = await puppeteer.launch(BLINKIT_CONFIG.BROWSER_CONFIG);
    let allProducts = {};

    try {
      // Read existing products if the file exists
      if (fileExists(BLINKIT_CONFIG.PRODUCTS_FILE)) {
        allProducts = readJsonFile(BLINKIT_CONFIG.PRODUCTS_FILE) || {};
      }

      const page = await browser.newPage();

      for (const category of categories) {
        const categoryProducts = await this.scrapeCategoryProducts(
          page,
          category
        );
        if (categoryProducts.length > 0) {
          allProducts[category.name] = categoryProducts;
        } else {
          console.log(`⚠️ No products found in ${category.name}`);
        }
        await delay(BLINKIT_CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      writeJsonFile(BLINKIT_CONFIG.PRODUCTS_FILE, allProducts);
      console.log("All products saved to", BLINKIT_CONFIG.PRODUCTS_FILE);
      return allProducts;
    } catch (error) {
      console.error("Error scraping Blinkit products:", error.message);
      return null;
    } finally {
      await browser.close();
    }
  }

  async scrapeCategoryProducts(page, category) {
    try {
      await page.goto(category.url, { waitUntil: "networkidle0" });

      // Check if the category has no products
      const noProductsSelector = ".plp__prouct--not-found-text";
      const noProducts = await page.$(noProductsSelector);
      if (noProducts) {
        console.log(`⚠️ No products found in ${category.name}`);
        return [];
      }

      await page.waitForSelector(
        ".ProductsContainer__ProductListContainer-sc-1k8vkvc-0"
      );

      let products = [];
      let lastProductCount = 0;
      let noNewProductsCount = 0;
      const maxNoNewProductsAttempts = 1;

      while (noNewProductsCount < maxNoNewProductsAttempts) {
        // Scroll 100vh in each attempt
        await page.evaluate(async () => {
          const viewportHeight = window.innerHeight;
          const scrollAmount = viewportHeight * 1; // 100vh

          window.scrollBy({
            top: scrollAmount,
            behavior: "smooth",
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
        });

        await delay(500);

        const currentProducts = await this.extractProducts(page);

        if (currentProducts.length > lastProductCount) {
          products = currentProducts;
          lastProductCount = currentProducts.length;
          noNewProductsCount = 0; // Reset counter as we found new products
        } else {
          noNewProductsCount++;
        }
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

  async extractProducts(page) {
    return await page.evaluate(() => {
      const products = [];
      const productGrid = document.querySelector(
        ".ProductsContainer__ProductListContainer-sc-1k8vkvc-0.gBBJEb"
      );

      const productElements = productGrid.children;
      Array.from(productElements).forEach((productElement) => {
        try {
          const name = productElement.querySelector(
            ".Product__UpdatedTitle-sc-11dk8zk-9"
          )?.textContent;
          const url = productElement.href;
          const image = productElement.querySelector(
            ".Imagestyles__ImageContainer-sc-1u3ccmn-0 img"
          )?.src;
          const variant = productElement
            .querySelector(".plp-product__quantity--box")
            ?.textContent.trim();
          const priceContainer = productElement.querySelector(
            ".Product__UpdatedPriceAndAtcContainer-sc-11dk8zk-10 div"
          );
          const actualPrice =
            priceContainer?.querySelector("div:nth-child(2)")?.textContent;
          const currentPrice =
            priceContainer?.querySelector("div:first-child")?.textContent;

          if (name && image && currentPrice) {
            products.push({
              name,
              url,
              image,
              variant,
              actualPrice,
              currentPrice,
            });
          }
        } catch (error) {
          console.log("Error parsing product:", error.message);
        }
      });

      return products;
    });
  }
}
