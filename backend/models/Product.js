const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    unit: { type: String, required: true },
    imageUrl: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);