import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema({
  price: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      index: true,
    },
    platform: {
      type: String,
      enum: ["D-Mart", "Zepto", "Blinkit"],
      required: true,
      index: true,
    },
    currentPrice: {
      type: String,
      required: true,
    },
    actualPrice: {
      type: String,
    },
    priceHistory: [priceHistorySchema],
    available: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: "text", category: "text" });

productSchema.methods.updatePrice = async function (newPrice) {
  this.priceHistory.push({
    price: newPrice,
    date: new Date(),
  });

  return this.save();
};

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
