import { CategoryService } from "./services/categoryService.js";
import { ProductService } from "./services/productService.js";

const main = async () => {
  try {
    const categoryService = new CategoryService();
    const productService = new ProductService();

    const categories = await categoryService.fetchCategories();
    if (categories) {
      await productService.scrapeProducts(categories);
    }
  } catch (error) {
    console.error("Application error:", error.message);
  }
};

main();
