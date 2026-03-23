const Product = require("../models/Product");

// Get all products
const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;

        let filter = {};

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const products = await Product.find(filter);
        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get single product
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(product);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Add product (admin use)
const addProduct = async (req, res) => {
    try {
        const { name, category, price, stock, unit, imageUrl } = req.body;

        const product = await Product.create({
            name,
            category,
            price,
            stock,
            unit,
            imageUrl
        });

        res.status(201).json({ message: "Product added successfully", product });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { getProducts, getProductById, addProduct };