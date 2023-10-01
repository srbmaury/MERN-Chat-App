const fetch = require('node-fetch');
const dotenv = require("dotenv");

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateSmartReply(context) {
    const prompt = `Generate smart reply for given context:\nContext: ${context}\nSmart Reply:`;

    const response = await fetch('https://api.openai.com/v1/engines/text-davinci-003/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            prompt,
            max_tokens: 500,
        }),
    });

    const data = await response.json();
    return data.choices[0].text.trim();
}

async function smartReply(req, res) {
    const { content } = req.body;
    try {
        const smartReply = await generateSmartReply(content);
        res.status(200).json({ smartReply });
    } catch (error) {
        console.error("Error generating smart reply:", error);
        res.status(500).json({ error: "Failed to generate smart reply" });
    }
}

module.exports = { smartReply };
