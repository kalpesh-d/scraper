import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  variant: {
    type: String,
  },
  image: {
    type: String,
  },
  platformPrices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformPrice",
    },
  ],
  category: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create text index for search functionality
productSchema.index({ name: "text" });

const Product = mongoose.model("Product", productSchema);

export default Product;
