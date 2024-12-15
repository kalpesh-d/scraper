import { CategoryService } from "./services/categoryService.js";
import { ProductService } from "./services/productService.js";
import { BlinkitCategoryService } from "./services/blinkitCategoryService.js";

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
      // We'll implement product scraping later
    }
  } catch (error) {
    console.error("Application error:", error.message);
  }
};

main();
