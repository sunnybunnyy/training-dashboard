import express from "express";
import axios from "axios";
const router = express.Router();

// POST /api/recommend
router.post("/", async (req, res) => {
    try {
        const flaskUrl = "http://localhost:8000/api/recommend";
        const response = await fetch(flaskUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ features: req.body.features }),
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Error calling Flask API:", err);
        res.status(500).json({ error: "Recommendation service unavailable" });
    }
});

export default router;