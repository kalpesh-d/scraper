import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import PlatformPrice from "../models/PlatformPrice.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

async function loadJsonFile(filename) {
  const filePath = path.join(__dirname, "..", filename);
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

async function migrateProducts() {
  try {
    // Load data from JSON files
    const dmartData = await loadJsonFile("dmart-products.json");
    const zeptoData = await loadJsonFile("zepto-products.json");
    const blinkitData = await loadJsonFile("blinkit-products.json");

    // Clear existing data
    await Product.deleteMany({});
    await PlatformPrice.deleteMany({});

    // Process each platform's data
    const platforms = [
      { name: "dmart", data: dmartData },
      { name: "zepto", data: zeptoData },
      { name: "blinkit", data: blinkitData },
    ];

    const productMap = new Map();

    for (const platform of platforms) {
      console.log(`Processing ${platform.name} data...`);

      for (const [category, products] of Object.entries(platform.data)) {
        for (const item of products) {
          const productKey = `${item.name}_${item.variant}`;

          let product;
          if (productMap.has(productKey)) {
            product = productMap.get(productKey);
          } else {
            product = new Product({
              name: item.name,
              variant: item.variant,
              image: item.image,
              category: category,
            });
            await product.save();
            productMap.set(productKey, product);
          }

          // Generate platformProductId if not present (for Blinkit)
          const platformProductId =
            item.id || `${platform.name}-${product._id}-${Date.now()}`;

          // Create platform price entry
          const platformPrice = new PlatformPrice({
            platform: platform.name,
            productId: product._id,
            platformProductId: platformProductId,
            currentPrice: item.currentPrice,
            actualPrice: item.actualPrice,
            url: item.url,
            priceHistory: [
              {
                price: item.currentPrice,
                date: new Date(),
              },
            ],
          });

          await platformPrice.save();

          // Update product with platform price reference
          product.platformPrices.push(platformPrice._id);
          await product.save();
        }
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run migration
connectDB().then(() => {
  migrateProducts();
});
