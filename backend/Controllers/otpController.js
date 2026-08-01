const asyncHandler = require('express-async-handler');
const OTPModel = require('../models/otpModel');
const User = require('../models/userModel');
const nodemailer = require("nodemailer");
const path = require('path');
const fs = require("fs").promises;
const crypto = require("crypto");

const myEmailId = process.env.EMAIL_ID;
const emailPW = process.env.PASSWORD;

const sendOTP = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: myEmailId,
            pass: emailPW,
        },
    });

    try {
        const emailTemplate = await fs.readFile(path.join(__dirname, '..', 'templates', 'send-password-reset-email.html'), 'utf8');
        const html = emailTemplate.replace('{{otp}}', otp);

        const mailOptions = {
            from: myEmailId,
            to: email,
            subject: 'Password Reset',
            html,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to send password reset email');
    }
};

const generateOTP = asyncHandler(async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        if (!email) return res.status(400).json({ message: "Email is required" });

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'If the account exists, a password reset code was sent.' });
        }
        await OTPModel.deleteMany({ email });
        const otpEntry = new OTPModel({ email, otpHash });
        await otpEntry.save();

        await sendOTP(email, otp);

        res.status(200).json({ message: 'If the account exists, a password reset code was sent.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

const verifyOTP = asyncHandler(async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { otp, newPassword } = req.body;
        if (!email || !otp || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Valid email, code, and an 8-character password are required' });
        }
        const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
        const otpEntry = await OTPModel.findOne({ email, otpHash });

        if (!otpEntry) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const currentTime = new Date();
        const otpCreationTime = otpEntry.createdAt;
        const timeDifferenceSeconds = (currentTime - otpCreationTime) / 1000;

        const expirationSeconds = Number(process.env.OTP_EXPIRATION_TIME_SECONDS) || 600;
        if (timeDifferenceSeconds > expirationSeconds) {
            await otpEntry.deleteOne();
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'Invalid OTP' });

        user.password = newPassword;
        await user.save();

        await otpEntry.deleteOne();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change password' });
    }
});

module.exports = { generateOTP, verifyOTP };
