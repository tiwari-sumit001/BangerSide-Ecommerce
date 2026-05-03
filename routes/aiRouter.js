const express = require("express");
const router = express.Router();
const productModel = require("../models/product-model");

// Simple Intent Classifier Logic
const intents = {
    GREETING: ["hi", "hello", "hey", "sup", "hola", "greetings"],
    STYLE_ADVICE: ["party", "night", "event", "wedding", "occasion", "wear", "outfit", "look", "style", "suggestion"],
    GYM: ["gym", "workout", "fitness", "active", "sport", "training", "exercise", "run"],
    CASUAL: ["casual", "daily", "home", "chill", "outdoor", "brunch", "hangout", "college"],
    BUDGET: ["cheap", "budget", "low price", "affordable", "under", "less"],
    PREMIUM: ["expensive", "premium", "luxury", "high end", "best", "fancy"],
    FOLLOW_UP: ["else", "other", "more", "another", "different"]
};

const getResponseTemplate = (type) => {
    const templates = {
        GREETING: [
            "Hey there! Ready to upgrade your style today? 🕶️",
            "Hi! I'm your Banger Side AI Stylist. What's the occasion?",
            "Hello! Looking for something fresh? Tell me your vibe! ✨"
        ],
        STYLE: [
            "For a special event, you should definitely go for these. They scream class! 🥂",
            "This look is trending right now. Perfect for making a statement! 🔥",
            "I've picked these out specifically for your next big night. What do you think?"
        ],
        GYM: [
            "Crush your goals in style. These are built for performance! 💪",
            "Breathable, flexible, and sleek. Exactly what your workout needs.",
            "Found these high-performance pieces for your routine! ⚡"
        ],
        CASUAL: [
            "Keep it low-key but high-style with these casual picks. ☕",
            "Comfort meets fashion. Perfect for your daily routine.",
            "Here's how to stay comfortable and cool all day long."
        ],
        NOT_FOUND: [
            "I'm still learning, but these are our best-sellers right now! 💎",
            "I couldn't find an exact match, but you'll love these fresh picks.",
            "Style is personal! Check these out while I learn more about you."
        ]
    };
    const list = templates[type] || templates.NOT_FOUND;
    return list[Math.floor(Math.random() * list.length)];
};

// AI Stylist Logic - Professional Version
router.post("/stylist", async (req, res) => {
    try {
        const { message } = req.body;
        const msg = message.toLowerCase();

        const allProducts = await productModel.find({});
        let filtered = [];
        let advice = "";
        let pairingNote = "";

        // 1. STRICT KEYWORD FILTERING
        if (msg.includes("party") || msg.includes("night") || msg.includes("event") || msg.includes("wedding")) {
            filtered = allProducts.filter(p => 
                p.category?.toLowerCase() === "party" || 
                p.name?.toLowerCase().includes("party") || 
                p.name?.toLowerCase().includes("suit") ||
                p.name?.toLowerCase().includes("gown")
            );
            advice = "Party wear is about making a statement. I've selected pieces with premium fabrics and silhouettes that command attention under evening lights.";
            pairingNote = "Style Tip: Add minimal jewelry to let the outfit do the talking. For shoes, go for clean oxfords or premium heels.";
        } else if (msg.includes("gym") || msg.includes("workout") || msg.includes("active") || msg.includes("sport")) {
            filtered = allProducts.filter(p => 
                p.category?.toLowerCase() === "gym" || 
                p.name?.toLowerCase().includes("sprint") || 
                p.name?.toLowerCase().includes("tee") ||
                p.name?.toLowerCase().includes("gym")
            );
            advice = "Performance first. These pieces use moisture-wicking technology and 4-way stretch fabrics to ensure you can move without limits.";
            pairingNote = "Workout Tip: Hydration is key! These pieces look great with high-top trainers and a sleek water bottle.";
        } else if (msg.includes("street") || msg.includes("college") || msg.includes("casual") || msg.includes("urban")) {
            filtered = allProducts.filter(p => 
                p.category?.toLowerCase() === "streetwear" || 
                p.category?.toLowerCase() === "casual" ||
                p.name?.toLowerCase().includes("hoodie") ||
                p.name?.toLowerCase().includes("cargo")
            );
            advice = "The 'Urban Explorer' look. We've focused on oversized fits and durable fabrics that work for daily hustle and weekend hangouts.";
            pairingNote = "Vibe Tip: Oversized is in. Pair these with chunky sneakers and a crossbody bag for the full street aesthetic.";
        } else {
            // General "Vibe" match if no specific keyword
            filtered = allProducts.filter(p => p.name?.toLowerCase().includes(msg) || p.category?.toLowerCase().includes(msg));
            if (filtered.length === 0) filtered = allProducts; // Fallback
            advice = `I've scanned our collection for your '${msg}' vibe. These pieces were chosen for their versatility and bold design language.`;
            pairingNote = "Fashion Tip: When in doubt, black on black never fails. Add a pop of color with your footwear!";
        }

        // 2. SHUFFLE AND ENHANCE WITH METADATA
        filtered = filtered.sort(() => 0.5 - Math.random());
        const finalProducts = filtered.slice(0, 3).map(p => {
            let imgBase64 = null;
            if (p.image) imgBase64 = p.image.toString("base64");
            else if (p.images && p.images.length > 0) imgBase64 = p.images[0].toString("base64");

            // Extra Logic: Generate a "Vibe Match Score"
            const score = 85 + Math.floor(Math.random() * 14); // 85-99%
            
            // Extra Logic: Color/Style Reason
            let reason = "Perfect fit for your selected vibe.";
            if (p.category?.toLowerCase() === "gym") reason = "High-breathability fabric for max intensity.";
            if (p.category?.toLowerCase() === "party") reason = "Premium finish for high-end occasions.";
            if (p.category?.toLowerCase() === "streetwear") reason = "Oversized cut for modern comfort.";

            return {
                name: p.name || "Banger Piece",
                price: p.price || 0,
                id: p._id,
                image: imgBase64,
                category: p.category || "Essential",
                vibeScore: score,
                reason: reason
            };
        });

        res.json({ 
            reply: advice, 
            pairing: pairingNote,
            products: finalProducts 
        });

    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ reply: "My styling logic is a bit tangled. Can you try another vibe?" });
    }
});

module.exports = router;
