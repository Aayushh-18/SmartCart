const express = require("express");
const router = express.Router();
const { placeOrder, getUserOrders, getOrderById } = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");

router.post("/place", protect, placeOrder);
router.get("/myorders", protect, getUserOrders);
router.get("/:id", protect, getOrderById);

module.exports = router;