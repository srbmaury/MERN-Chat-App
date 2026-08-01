const { generateOpenAIResponse } = require("../services/openAIService");

async function generateSmartReply(context) {
    return generateOpenAIResponse(
        String(context).slice(0, 4000),
        "Generate one concise, natural smart reply. Return only the reply text.",
        120
    );
}

async function smartReply(req, res) {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Content is required" });
    }
    try {
        const smartReply = await generateSmartReply(content);
        res.status(200).json({ smartReply });
    } catch (error) {
        console.error("Error generating smart reply:", error);
        res.status(500).json({ error: "Failed to generate smart reply" });
    }
}

module.exports = { smartReply };
