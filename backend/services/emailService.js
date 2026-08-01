const nodemailer = require("nodemailer");

const EMAIL_TIMEOUT_MS = 10_000;

async function sendWithBrevo({ to, subject, html, text }) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sender: {
                name: process.env.FROM_NAME || "Talk-A-Tive",
                email: process.env.FROM_EMAIL || process.env.EMAIL_ID,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text,
        }),
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    });

    if (response.status !== 201) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`Brevo email failed (${response.status}): ${detail}`);
    }
}

async function sendWithGmail({ to, subject, html, text }) {
    if (!process.env.EMAIL_ID || !process.env.PASSWORD) {
        throw new Error("Email is not configured. Set BREVO_API_KEY or Gmail credentials.");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_ID, pass: process.env.PASSWORD },
        connectionTimeout: EMAIL_TIMEOUT_MS,
        greetingTimeout: EMAIL_TIMEOUT_MS,
        socketTimeout: EMAIL_TIMEOUT_MS,
    });

    await transporter.sendMail({
        from: process.env.EMAIL_ID,
        to,
        subject,
        html,
        text,
    });
}

async function sendEmail(message) {
    if (process.env.BREVO_API_KEY) return sendWithBrevo(message);
    return sendWithGmail(message);
}

function sendEmailInBackground(message) {
    setImmediate(() => {
        sendEmail(message).catch(error => console.error(`Background email failed: ${error.message}`));
    });
}

module.exports = { EMAIL_TIMEOUT_MS, sendEmail, sendEmailInBackground };
