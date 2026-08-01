const crypto = require("crypto");

const key = crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY || "").digest();

const encryptMessage = (plainText) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v2:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

const decryptMessage = (value) => {
    if (value.startsWith("v2:")) {
        const [, ivHex, tagHex, encryptedHex] = value.split(":");
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
        decipher.setAuthTag(Buffer.from(tagHex, "hex"));
        return Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, "hex")),
            decipher.final(),
        ]).toString("utf8");
    }

    // Backward compatibility for messages created with the original AES-CBC format.
    const legacyKey = process.env.ENCRYPTION_KEY;
    const iv = Buffer.from(value.slice(0, 32), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", legacyKey, iv);
    return decipher.update(value.slice(32), "hex", "utf8") + decipher.final("utf8");
};

module.exports = { encryptMessage, decryptMessage };
