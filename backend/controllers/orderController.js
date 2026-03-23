const Order = require("../models/Order");
const Product = require("../models/Product");

// Place an order
const placeOrder = async (req, res) => {
    try {
        const { items } = req.body;
        // items = [ { productId, quantity }, ... ]

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in order" });
        }

        let totalAmount = 0;

        for (let item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productId}` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }

            totalAmount += product.price * item.quantity;

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();
        }

        const order = await Order.create({
            userId: req.user.id,
            items,
            totalAmount
        });

        res.status(201).json({ message: "Order placed successfully", order });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all orders of logged in user
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id })
            .populate("items.productId", "name price unit category")
            .sort({ orderDate: -1 });

        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get single order
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("items.productId", "name price unit category");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        res.status(200).json(order);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { placeOrder, getUserOrders, getOrderById };