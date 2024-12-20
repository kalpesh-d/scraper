import Product from "../../models/Product.js";

export const upsertProduct = async (productData, platform) => {
  try {
    // Create a query to find existing product by name and variant
    const query = {
      name: productData.name,
      ...(productData.variant && { variant: productData.variant }),
    };

    // Find existing product
    let product = await Product.findOne(query);

    if (!product) {
      // Create new product if it doesn't exist
      product = new Product({
        name: productData.name,
        variant: productData.variant,
        image: productData.image,
        category: productData.category,
        platform: platform,
        priceHistory: [],
        currentPrice: productData.currentPrice,
        actualPrice: productData.actualPrice,
        available: productData.available,
      });
    }

    // Update the product with new price information
    await product.updatePrice(
      productData.currentPrice,
      productData.actualPrice
    );

    return product;
  } catch (error) {
    console.error("Error upserting product:", error);
    throw error;
  }
};
