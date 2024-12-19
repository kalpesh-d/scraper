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

const platformPriceSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ["dmart", "zepto", "blinkit"],
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  platformProductId: {
    type: String,
    required: true,
  },
  currentPrice: {
    type: String,
    required: true,
  },
  actualPrice: {
    type: String,
  },
  priceHistory: [priceHistorySchema],
  url: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const PlatformPrice = mongoose.model("PlatformPrice", platformPriceSchema);

export default PlatformPrice;
