import puppeteer from "puppeteer";
import { ZEPTO_CONFIG, ZEPTO_SELECTORS } from "../config/config.js";
import { delay } from "../utils/fileUtils.js";
import { upsertProduct } from "../utils/productUtils.js";

export class ZeptoProductService {
  generateProductUrl(category, subcategory) {
    const formattedName = category.name
      .toLowerCase()
      .replace(/&/g, "")
      .replace(/\s+/g, "-")
      .trim();

    return `${ZEPTO_CONFIG.BASE_URL}/cn/${formattedName}/cid/${category.id}/scid/${subcategory.id}`;
  }

  async extractProducts(page) {
    return await page.evaluate((selectors) => {
      const products = [];
      const productGrids = document.querySelectorAll(selectors.PRODUCT_ITEM);

      productGrids.forEach((product) => {
        try {
          const image = product.querySelector(selectors.PRODUCT_IMAGE);
          const srcset = image.getAttribute("srcset");
          const regex = /(https?:\/\/[^\s]+)/;
          const imageUrl = srcset.match(regex)[0];

          const nameElement = product.querySelector(selectors.PRODUCT_NAME);
          const name = nameElement ? nameElement.textContent.trim() : "";

          const variantElement = product.querySelector(
            selectors.PRODUCT_VARIANT
          );
          const variant = variantElement
            ? variantElement.textContent.trim()
            : "";

          const id = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${variant
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")}`;

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

          const outOfStock = product.querySelector(
            ".relative.my-3.rounded-t-xl.rounded-b-md.group.mb-12"
          );
          const available = !outOfStock;

          if (name && imageUrl && currentPrice) {
            products.push({
              id,
              name,
              variant,
              platform: "zepto",
              currentPrice,
              actualPrice,
              image: imageUrl,
              available,
            });
          }
        } catch (error) {
          console.log("Error parsing product:", error.message);
        }
      });

      return products;
    }, ZEPTO_SELECTORS);
  }

  async scrapeCategoryProducts(page, category, subcategory) {
    try {
      const url = this.generateProductUrl(category, subcategory);
      console.log(`Scraping products from: ${subcategory.name}`);

      await page.goto(url, { waitUntil: "networkidle0" });
      await delay(2000);

      await page.waitForSelector(ZEPTO_SELECTORS.PRODUCTS_CONTAINER);

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
        const products = await this.extractProducts(page);

        // Save each product to MongoDB
        for (const product of products) {
          if (!processedProducts.includes(product.id)) {
            await upsertProduct(
              {
                ...product,
                category: subcategory.name,
              },
              "zepto"
            );
            processedProducts.push(product.id);
          }
        }

        console.log(`Processed ${processedProducts.length} products so far...`);
      }

      console.log(
        `✅ Finished scraping ${subcategory.name} with ${processedProducts.length} products`
      );
      return processedProducts;
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

      for (const category of categories.categories) {
        console.log(`\nProcessing category: ${category.name}`);

        // Process subcategories sequentially
        for (const subcategory of category.subcategories) {
          await this.scrapeCategoryProducts(page, category, subcategory);

          await delay(200); // Add delay between subcategories
        }
      }

      console.log(`\n✅ Finished scraping all Zepto categories`);
      return true;
    } catch (error) {
      console.error("Error scraping Zepto products:", error.message);
      return null;
    } finally {
      await browser.close();
    }
  }
}
