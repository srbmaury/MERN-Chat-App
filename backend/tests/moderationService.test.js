const test = require("node:test");
const assert = require("node:assert/strict");
const { moderateContent, normalizeModerationCategory } = require("../services/moderationService");

test("normalizes the labels returned by the linked Flask API", () => {
    assert.equal(normalizeModerationCategory("Offensive Content"), "Offensive");
    assert.equal(normalizeModerationCategory("Hateful Content"), "Hateful");
    assert.equal(normalizeModerationCategory("Neither"), "Neither");
});

test("accepts legacy short labels and safely ignores unknown results", () => {
    assert.equal(normalizeModerationCategory(" offensive "), "Offensive");
    assert.equal(normalizeModerationCategory("HATEFUL"), "Hateful");
    assert.equal(normalizeModerationCategory("unexpected"), "Neither");
    assert.equal(normalizeModerationCategory(null), "Neither");
});

test("posts text to the configured Flask endpoint", async () => {
    const originalFetch = global.fetch;
    const originalUrl = process.env.MODERATION_API_URL;
    let request;
    process.env.MODERATION_API_URL = "http://127.0.0.1:8000/";
    global.fetch = async (url, options) => {
        request = { url, options };
        return { ok: true, json: async () => ({ prediction: "Offensive Content" }) };
    };

    try {
        assert.equal(await moderateContent("test message"), "Offensive");
        assert.equal(request.url, "http://127.0.0.1:8000/api/predict");
        assert.deepEqual(JSON.parse(request.options.body), { text: "test message" });
    } finally {
        global.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.MODERATION_API_URL;
        else process.env.MODERATION_API_URL = originalUrl;
    }
});
