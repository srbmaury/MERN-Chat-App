const test = require("node:test");
const assert = require("node:assert/strict");
const { rateLimit } = require("../middleware/rateLimiter");

const createResponse = () => ({
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
});

test("rate limiter blocks requests above the authenticated-user limit", () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 2 });
    const request = {
        ip: "127.0.0.1",
        baseUrl: "/api/message",
        path: "/",
        route: { path: "/" },
        user: { _id: "user-rate-test" },
    };

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        const response = createResponse();
        let continued = false;
        middleware(request, response, () => { continued = true; });
        assert.equal(continued, true);
        assert.equal(response.headers["RateLimit-Limit"], 2);
    }

    const blockedResponse = createResponse();
    let blockedContinued = false;
    middleware(request, blockedResponse, () => { blockedContinued = true; });
    assert.equal(blockedContinued, false);
    assert.equal(blockedResponse.statusCode, 429);
    assert.match(blockedResponse.body.message, /Too many requests/i);
});
