const express = require("express");
const axios = require("axios");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const AI_MODULE_URL = process.env.AI_MODULE_URL || "http://localhost:8000";

/**
 * POST /api/chat
 * Body: { message: string, history?: Array<{role, parts}> }
 *
 * Proxies to the Python AI module /chat endpoint.
 * Protected by JWT — req.user is set by authMiddleware.
 */
router.post("/", protect, async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({ message: "message field is required" });
    }

    try {
        const aiRes = await axios.post(`${AI_MODULE_URL}/chat`, {
            userId: req.user.id,
            message: message.trim(),
            history,
        });

        res.json({ reply: aiRes.data.reply });
    } catch (err) {
        const detail =
            err.response?.data?.detail ||
            err.message ||
            "AI module unavailable";
        console.error("[chat proxy]", detail);
        res.status(502).json({ message: detail });
    }
});

module.exports = router;
