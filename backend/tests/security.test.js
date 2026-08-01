const test = require("node:test");
const assert = require("node:assert/strict");

process.env.ENCRYPTION_KEY ||= "0123456789abcdef0123456789abcdef";

const { encryptMessage, decryptMessage } = require("../utils/messageCrypto");
const { parseCookies } = require("../utils/cookies");

test("message encryption round-trips and uses a unique authenticated ciphertext", () => {
    const first = encryptMessage("hello");
    const second = encryptMessage("hello");

    assert.match(first, /^v2:/);
    assert.notEqual(first, second);
    assert.equal(decryptMessage(first), "hello");
    assert.equal(decryptMessage(second), "hello");
});

test("authenticated ciphertext rejects tampering", () => {
    const encrypted = encryptMessage("private message");
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("0") ? "1" : "0"}`;

    assert.throws(() => decryptMessage(tampered));
});

test("cookie parser extracts the HTTP-only authentication cookie value", () => {
    assert.deepEqual(parseCookies("theme=dark; authToken=abc.def; encoded=hello%20world"), {
        theme: "dark",
        authToken: "abc.def",
        encoded: "hello world",
    });
});
