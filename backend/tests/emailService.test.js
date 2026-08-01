const test = require("node:test");
const assert = require("node:assert/strict");
const { sendEmail } = require("../services/emailService");

test("Brevo email uses the HTTPS API and configured sender", async () => {
    const originalFetch = global.fetch;
    const originalEnv = {
        BREVO_API_KEY: process.env.BREVO_API_KEY,
        FROM_EMAIL: process.env.FROM_EMAIL,
        FROM_NAME: process.env.FROM_NAME,
    };
    let request;

    process.env.BREVO_API_KEY = "test-api-key";
    process.env.FROM_EMAIL = "sender@example.com";
    process.env.FROM_NAME = "Talk-A-Tive Test";
    global.fetch = async (url, options) => {
        request = { url, options };
        return { status: 201, text: async () => "" };
    };

    try {
        await sendEmail({
            to: "recipient@example.com",
            subject: "Verify",
            html: "<p>Verify</p>",
            text: "Verify",
        });
        const body = JSON.parse(request.options.body);
        assert.equal(request.url, "https://api.brevo.com/v3/smtp/email");
        assert.equal(request.options.headers["api-key"], "test-api-key");
        assert.deepEqual(body.sender, { name: "Talk-A-Tive Test", email: "sender@example.com" });
        assert.deepEqual(body.to, [{ email: "recipient@example.com" }]);
    } finally {
        global.fetch = originalFetch;
        for (const [key, value] of Object.entries(originalEnv)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});

test("Brevo email reports non-success responses", async () => {
    const originalFetch = global.fetch;
    const originalKey = process.env.BREVO_API_KEY;
    process.env.BREVO_API_KEY = "test-api-key";
    global.fetch = async () => ({ status: 400, text: async () => "invalid sender" });

    try {
        await assert.rejects(
            sendEmail({ to: "recipient@example.com", subject: "Test", html: "Test", text: "Test" }),
            /Brevo email failed \(400\): invalid sender/
        );
    } finally {
        global.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.BREVO_API_KEY;
        else process.env.BREVO_API_KEY = originalKey;
    }
});
