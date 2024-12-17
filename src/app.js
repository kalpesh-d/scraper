import { CategoryService } from "./services/categoryService.js";
import { ProductService } from "./services/productService.js";
import { BlinkitCategoryService } from "./services/blinkitCategoryService.js";
import { BlinkitProductService } from "./services/blinkitProductService.js";
import { ZeptoCategoryService } from "./services/zeptoCategoryService.js";

const main = async () => {
  try {
    // DMart scraping
    const categoryService = new CategoryService();
    const productService = new ProductService();

    const categories = await categoryService.fetchCategories();
    if (categories) {
      await productService.scrapeProducts(categories);
    }

    // Blinkit scraping
    console.log("\n=== Starting Blinkit Scraping ===\n");
    const blinkitCategoryService = new BlinkitCategoryService();
    const blinkitCategories = await blinkitCategoryService.fetchCategories();

    if (blinkitCategories) {
      console.log("Successfully scraped Blinkit categories");
      const blinkitProductService = new BlinkitProductService();
      for (const categoryGroup of Object.values(blinkitCategories)) {
        await blinkitProductService.scrapeProducts(categoryGroup);
      }
    }

    // Zepto scraping
    console.log("\n=== Starting Zepto Scraping ===\n");
    const zeptoCategoryService = new ZeptoCategoryService();
    const zeptoCategories = await zeptoCategoryService.fetchCategories();

    if (zeptoCategories) {
      console.log("Successfully scraped Zepto categories");
      // TODO: Add product scraping logic here
    }
  } catch (error) {
    console.error("Application error:", error.message);
  }
};

main();
