const express = require("express");
const router = express.Router();
const { getProducts, getProductById, addProduct } = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, getProducts);
router.get("/:id", protect, getProductById);
router.post("/add", addProduct);

module.exports = router;