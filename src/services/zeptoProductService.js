import puppeteer from "puppeteer";
import { ZEPTO_CONFIG, ZEPTO_SELECTORS } from "../config/config.js";
import {
  fileExists,
  readJsonFile,
  writeJsonFile,
  delay,
} from "../utils/fileUtils.js";

export class ZeptoProductService {
  generateProductUrl(category, subcategory) {
    // Convert category name to URL format (lowercase, spaces to hyphens, remove special chars)
    const formattedName = category.name
      .toLowerCase() // Convert to lowercase
      .replace(/&/g, "") // Remove &
      .replace(/\s+/g, "-") // Replace one or more spaces with single hyphen
      .trim(); // Remove leading/trailing whitespace

    return `${ZEPTO_CONFIG.BASE_URL}/cn/${formattedName}/cid/${category.id}/scid/${subcategory.id}`;
  }

  async extractProducts(page) {
    const products = await page.evaluate((selectors) => {
      const productElements = document.querySelectorAll(selectors.PRODUCT_ITEM);

      return Array.from(productElements).map((product) => {
        const image = product.querySelector(selectors.PRODUCT_IMAGE);
        const srcset = image.getAttribute("srcset");
        const regex = /(https?:\/\/[^\s]+)/;
        const imageUrl = srcset.match(regex)[0];

        // Get name
        const nameElement = product.querySelector(selectors.PRODUCT_NAME);
        const name = nameElement ? nameElement.textContent.trim() : "";

        // Get variant
        const variantElement = product.querySelector(selectors.PRODUCT_VARIANT);
        const variant = variantElement ? variantElement.textContent.trim() : "";

        // Create unique ID
        const id = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${variant
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")}`;

        // Get prices
        const currentPriceElement = product.querySelector(
          selectors.CURRENT_PRICE
        );
        const actualPriceElement = product.querySelector(
          selectors.ACTUAL_PRICE
        );

        const currentPrice = currentPriceElement
          ? currentPriceElement.textContent.trim()
          : "";
        const actualPrice = actualPriceElement
          ? actualPriceElement.textContent.trim()
          : "";

        return {
          id,
          name,
          variant,
          currentPrice,
          actualPrice,
          image: imageUrl,
        };
      });
    }, ZEPTO_SELECTORS);

    return products;
  }

  async scrapeCategoryProducts(page, category, subcategory) {
    try {
      const url = this.generateProductUrl(category, subcategory);
      console.log(`Scraping products from: ${subcategory.name}`);

      await page.goto(url, { waitUntil: "networkidle0" });
      await delay(2000);

      // Wait for products container
      await page.waitForSelector(ZEPTO_SELECTORS.PRODUCTS_CONTAINER);

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
        products = await this.extractProducts(page);
        console.log(`Found ${products.length} products so far...`);
      }

      console.log(
        `✅ Finished scraping ${subcategory.name} with ${products.length} products`
      );
      return products;
    } catch (error) {
      console.error(
        `Error scraping products for ${subcategory.name}:`,
        error.message
      );
      return [];
    }
  }

  async scrapeProducts(categories) {
    const browser = await puppeteer.launch({
      ...ZEPTO_CONFIG.BROWSER_CONFIG,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      // Block unnecessary resources
      page.on("request", (req) => {
        if (["stylesheet", "font", "media"].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      let allProducts = {};

      for (const category of categories.categories) {
        console.log(`\nProcessing category: ${category.name}`);

        // Process subcategories sequentially instead of in parallel
        for (const subcategory of category.subcategories) {
          const products = await this.scrapeCategoryProducts(
            page,
            category,
            subcategory
          );

          // Store products for this subcategory
          allProducts[subcategory.name] = products;

          // Write data to file
          writeJsonFile(ZEPTO_CONFIG.PRODUCTS_FILE, allProducts);

          console.log(`Saved products for ${subcategory.name}`);
          await delay(200); // Add delay between subcategories
        }
      }

      console.log(`\n✅ Finished scraping all categories`);

      return allProducts;
    } catch (error) {
      console.error("Error scraping Zepto products:", error.message);
      return null;
    } finally {
      await browser.close();
    }
  }
}
