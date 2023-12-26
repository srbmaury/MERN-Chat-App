const asyncHandler = require('express-async-handler');
const OTPModel = require('../models/otpModel');
const dotenv = require("dotenv");
const User = require('../models/userModel');
const nodemailer = require("nodemailer");
const path = require('path');
const fs = require("fs").promises;
const cron = require('node-cron');

dotenv.config();

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
        const __dirname1 = path.resolve();
        const emailTemplate = await fs.readFile(path.join(__dirname1, 'backend', 'templates', 'send-password-reset-email.html'), 'utf8');
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
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.findOne({ email });
        if (!user) {
            throw Error(`User with ${email} not found`);
        }
        const otpEntry = new OTPModel({ email, otp });
        await otpEntry.save();

        await sendOTP(email, otp);

        res.status(200).json({ message: 'OTP generated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

const bcrypt = require('bcryptjs');

const verifyOTP = asyncHandler(async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const otpEntry = await OTPModel.findOne({ email, otp });

        if (!otpEntry) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const currentTime = new Date();
        const otpCreationTime = otpEntry.createdAt;
        const timeDifferenceSeconds = (currentTime - otpCreationTime) / 1000;

        if (timeDifferenceSeconds > process.env.OTP_EXPIRATION_TIME_SECONDS) {
            await otpEntry.remove();
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const user = await User.findOne({ email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        await otpEntry.remove();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change password' });
    }
});

cron.schedule('* * * * *', async () => {
    try {
        const currentTime = new Date();
        const otpExpirationTime = new Date(currentTime.getTime() - process.env.OTP_EXPIRATION_TIME_SECONDS * 1000);

        // Find all OTPs that have expired
        const expiredOTPs = await OTPModel.find({ createdAt: { $lt: otpExpirationTime } });

        // Delete expired OTPs
        if (expiredOTPs.length > 0) {
            await OTPModel.deleteMany({ _id: { $in: expiredOTPs.map((otp) => otp._id) } });
            console.log(`${expiredOTPs.length} expired OTP(s) deleted.`);
        }
    } catch (error) {
        console.error('Error while deleting expired OTPs:', error.message);
    }
});

module.exports = { generateOTP, verifyOTP };