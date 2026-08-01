const nodemailer = require("nodemailer");

const EMAIL_TIMEOUT_MS = 10_000;

const isPlaceholder = value => !value || /^(replace-|your-|xkeysib-your-)/i.test(value.trim());
const isBrevoConfigured = () =>
    !isPlaceholder(process.env.BREVO_API_KEY) && !isPlaceholder(process.env.FROM_EMAIL);

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
    return { provider: "brevo", accepted: [to] };
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

    const info = await transporter.sendMail({
        from: process.env.EMAIL_ID,
        to,
        subject,
        html,
        text,
    });
    return {
        provider: "gmail",
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        messageId: info.messageId,
    };
}

async function sendEmail(message) {
    if (isBrevoConfigured()) return sendWithBrevo(message);
    return sendWithGmail(message);
}

function sendEmailInBackground(message) {
    setImmediate(() => {
        sendEmail(message)
            .then(result => console.log(`Background email accepted by ${result.provider}: ${result.accepted.join(", ")}`))
            .catch(error => console.error(`Background email failed: ${error.message}`));
    });
}

module.exports = { EMAIL_TIMEOUT_MS, isBrevoConfigured, sendEmail, sendEmailInBackground };
