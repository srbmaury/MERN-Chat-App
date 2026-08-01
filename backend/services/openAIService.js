const extractOutputText = (data) => (data.output || [])
    .filter(item => item.type === "message")
    .flatMap(item => item.content || [])
    .filter(item => item.type === "output_text")
    .map(item => item.text)
    .join("")
    .trim();

async function generateOpenAIResponse(input, instructions, maxOutputTokens = 500) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI integration is not configured");

    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-5.6",
            instructions,
            input,
            max_output_tokens: maxOutputTokens,
        }),
        signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenAI request failed");
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error("OpenAI returned no text");
    return outputText;
}

module.exports = { generateOpenAIResponse };
