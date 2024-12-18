import { DmartCategoryService } from "./services/dmartCategoryService.js";
import { DmartProductService } from "./services/dmartProductService.js";
import { BlinkitCategoryService } from "./services/blinkitCategoryService.js";
import { BlinkitProductService } from "./services/blinkitProductService.js";
import { ZeptoCategoryService } from "./services/zeptoCategoryService.js";
import { ZeptoProductService } from "./services/zeptoProductService.js";

const main = async () => {
  try {
    const dmartCategoryService = new DmartCategoryService();
    const dmartpProductService = new DmartProductService();

    const categories = await dmartCategoryService.fetchCategories();
    if (categories) {
      await dmartpProductService.scrapeProducts(categories);
    }

    const blinkitCategoryService = new BlinkitCategoryService();
    const blinkitCategories = await blinkitCategoryService.fetchCategories();

    if (blinkitCategories) {
      const blinkitProductService = new BlinkitProductService();
      for (const categoryGroup of Object.values(blinkitCategories)) {
        await blinkitProductService.scrapeProducts(categoryGroup);
      }
    }

    const zeptoCategoryService = new ZeptoCategoryService();
    const zeptoCategories = await zeptoCategoryService.fetchCategories();

    if (zeptoCategories) {
      const zeptoProductService = new ZeptoProductService();
      await zeptoProductService.scrapeProducts(zeptoCategories);
    }
  } catch (error) {
    console.error("Application error:", error.message);
  }
};

main();
