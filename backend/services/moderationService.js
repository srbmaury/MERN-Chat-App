const MODERATION_CATEGORIES = new Map([
    ["offensive", "Offensive"],
    ["offensive content", "Offensive"],
    ["hateful", "Hateful"],
    ["hateful content", "Hateful"],
    ["neither", "Neither"],
]);
const DEFAULT_MODERATION_API_URL = "https://offensive-content-api.onrender.com";

const normalizeModerationCategory = (prediction) => {
    if (typeof prediction !== "string") return "Neither";
    return MODERATION_CATEGORIES.get(prediction.trim().toLowerCase()) || "Neither";
};

const moderateContent = async (content) => {
    if (!content) return "Neither";
    const moderationApiUrl = process.env.MODERATION_API_URL || DEFAULT_MODERATION_API_URL;
    const response = await fetch(`${moderationApiUrl.replace(/\/$/, "")}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
        signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Moderation service rejected the request (${response.status})`);
    const data = await response.json();
    return normalizeModerationCategory(data.prediction);
};

module.exports = { moderateContent, normalizeModerationCategory };
