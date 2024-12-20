import puppeteer from "puppeteer";
import { BLINKIT_CONFIG } from "../config/config.js";
import { delay } from "../utils/fileUtils.js";
import { upsertProduct } from "../utils/productUtils.js";

export class BlinkitProductService {
  async scrapeProducts(categories) {
    const browser = await puppeteer.launch(BLINKIT_CONFIG.BROWSER_CONFIG);

    try {
      const page = await browser.newPage();

      for (const category of categories) {
        const categoryProducts = await this.scrapeCategoryProducts(
          page,
          category
        );
        if (categoryProducts.length === 0) {
          console.log(`⚠️ No products found in ${category.name}`);
        }
        await delay(BLINKIT_CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      console.log("✅ Finished scraping all Blinkit products");
      return true;
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

      let processedProducts = [];
      let lastProductCount = 0;
      let noNewProductsCount = 0;
      const maxNoNewProductsAttempts = 3; // Increased attempts to ensure full page load

      while (noNewProductsCount < maxNoNewProductsAttempts) {
        // Scroll 100vh in each attempt
        await page.evaluate(async () => {
          const viewportHeight = window.innerHeight;
          const scrollAmount = viewportHeight * 1; // 100vh

          window.scrollBy({
            top: scrollAmount,
            behavior: "smooth",
          });

          await new Promise((resolve) => setTimeout(resolve, 500)); // Increased wait time
        });

        await delay(500); // Increased delay

        const currentProducts = await this.extractProducts(page, category.name);

        // Save new products to MongoDB
        for (const product of currentProducts) {
          if (!processedProducts.includes(product.id)) {
            await upsertProduct(
              {
                ...product,
                category: category.name,
              },
              "blinkit"
            );
            processedProducts.push(product.id);
          }
        }

        if (currentProducts.length > lastProductCount) {
          lastProductCount = currentProducts.length;
          noNewProductsCount = 0; // Reset counter as we found new products
        } else {
          noNewProductsCount++;
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
    return await page.evaluate(() => {
      const products = [];
      const productGrid = document.querySelector(
        ".ProductsContainer__ProductListContainer-sc-1k8vkvc-0.gBBJEb"
      );

      if (!productGrid) return products;

      const productElements = productGrid.children;
      Array.from(productElements).forEach((productElement) => {
        try {
          const name = productElement.querySelector(
            ".Product__UpdatedTitle-sc-11dk8zk-9"
          )?.textContent;
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
          const outOfStock = productElement.querySelector(
            ".AddToCart__UpdatedOutOfStockTag-sc-17ig0e3-4.bxVUKb"
          )
            ? true
            : false;

          // Create unique ID by combining name and variant
          const id = `${name}_${variant || ""}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_");

          if (name && image && currentPrice) {
            products.push({
              id,
              name,
              image,
              variant,
              platform: "blinkit",
              actualPrice,
              currentPrice,
              available: !outOfStock,
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
