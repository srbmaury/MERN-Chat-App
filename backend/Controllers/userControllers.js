const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const path = require('path');
const fs = require('fs').promises;
const crypto = require("crypto");
const { sendEmailInBackground } = require("../services/emailService");

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const secureCookies = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : (process.env.API_BASE_URL || "").startsWith("https://");

const queueVerificationEmail = async (email, verificationToken) => {
    const templatePath = path.join(__dirname, '..', 'templates', 'send-verification-email-success.html');
    const emailTemplate = await fs.readFile(templatePath, 'utf8');
    const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verificationUrl = `${apiBaseUrl}/api/user/verify/${verificationToken}`;
    const html = emailTemplate.replace('{{verificationUrl}}', verificationUrl);
    sendEmailInBackground({
        to: email,
        subject: 'Verify your Talk-A-Tive email',
        html,
        text: `Verify your email by visiting: ${verificationUrl}`,
    });
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
        res.status(400);
        throw new Error("Please Enter all the fields");
    }
    if (name.trim().length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Enter a valid name and email address" });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must contain at least 8 characters" });
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenHash = hashToken(verificationToken);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        verificationToken: verificationTokenHash,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (user) {
        await queueVerificationEmail(normalizedEmail, verificationToken);
        res.status(201).json({ message: "Registration successful. Please verify your email." });
    } else {
        res.status(400);
        throw new Error("Failed to create the user");
    }
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email, isEmailVerified: false, isBot: { $ne: true } });
    if (user) {
        const token = generateVerificationToken();
        user.verificationToken = hashToken(token);
        user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
        await queueVerificationEmail(email, token);
    }

    res.json({ message: "If an unverified account exists, a verification email has been sent." });
});

const verifyEmail = asyncHandler(async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: hashToken(token),
            verificationTokenExpiresAt: { $gt: new Date() },
        });

        if (!user) {
            res.status(404).json({ error: "Invalid verification token" });
            return;
        }

        user.isEmailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        const successTemplate = await fs.readFile(path.join(__dirname, '..', 'templates', 'verification-success.html'), 'utf8');
        const successHtml = successTemplate.replace('{{clientUrl}}', process.env.CLIENT_APP_URL || 'http://localhost:3000');
        const failureHtml = await fs.readFile(path.join(__dirname, '..', 'templates', 'verification-failure.html'), 'utf8');

        if (user.isEmailVerified) {
            res.send(successHtml);
        } else {
            res.send(failureHtml);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user?.isBot) return res.status(401).json({ message: "Invalid Email or Password" });

    if (user && (await user.matchPassword(password))) {
        if (user.blocked) {
            return res.status(403).json({ message: "Your account is blocked. Please contact support." });
        }
        if (user.isEmailVerified) {
            const token = generateToken(user._id);
            res.cookie("authToken", token, {
                httpOnly: true,
                secure: secureCookies,
                sameSite: process.env.COOKIE_SAME_SITE || "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            });
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                isEmailVerified: user.isEmailVerified,
                blocked: user.blocked,
                isAdmin: user.isAdmin,
            });
        } else {
            res.status(403);
            throw new Error("Please verify your email first");
        }
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
});

const logoutUser = asyncHandler(async (_req, res) => {
    res.clearCookie("authToken", {
        httpOnly: true,
        secure: secureCookies,
        sameSite: process.env.COOKIE_SAME_SITE || "lax",
        path: "/",
    });
    res.status(204).send();
});

const allUsers = asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? escapeRegExp(req.query.search.slice(0, 100)) : "";
    const keyword = search
        ? {
              $or: [
                  { name: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
              ],
          }
        : {};

    const users = await User.find(keyword)
        .find({ _id: { $ne: req.user._id } })
        .select("_id name email pic isBot");
    res.send(users);
});

const updateProfilePicture = asyncHandler(async (req, res) => {
    try {
        let pictureUrl;
        try {
            pictureUrl = new URL(req.body.pic);
        } catch {
            return res.status(400).json({ message: "A valid profile picture URL is required" });
        }
        if (pictureUrl.protocol !== "https:") {
            return res.status(400).json({ message: "Profile pictures must use HTTPS" });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { pic: pictureUrl.toString() },
            { new: true }
        );
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            isEmailVerified: user.isEmailVerified,
            blocked: user.blocked,
            isAdmin: user.isAdmin,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const submitForReview = asyncHandler(async (req, res) => {
    const { foulMessage } = req.body;
    if (typeof foulMessage !== "string" || !foulMessage.trim() || foulMessage.length > 10_000) {
        return res.status(400).json({ message: "A valid message is required" });
    }
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.submittedForReview.includes(foulMessage)) user.submittedForReview.push(foulMessage);

        await user.save();

        res.status(200).json({ message: "Submitted for review successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to submit for review." });
    }
});

const fetchSubmitForReview = asyncHandler(async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                message:
                    "Unauthorized. Only admins can fetch 'submit for review' messages.",
            });
        }

        const users = await User.find(
            { submittedForReview: { $ne: [] } },
            "_id name submittedForReview"
        );

        const usersWithSubmitForReview = [];

        users.forEach((user) => {
            if (!user.submittedForReview?.length) return;
            usersWithSubmitForReview.push({
                _id: user._id,
                name: user.name,
                submittedForReview: user.submittedForReview,
            });
        });

        res.status(200).json({ usersWithSubmitForReview });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to fetch 'submit for review' messages.",
        });
    }
});

const review = asyncHandler(async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                message:
                    "Unauthorized. Only admins can fetch 'submit for review' messages.",
            });
        }

        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length > 100) {
            return res.status(400).json({ message: "Invalid review batch" });
        }

        for (const message of messages) {
            if (!message.userId || typeof message.message !== "string") continue;
            const reviewMessage = message.message;
            const user = await User.findById(message.userId);
            if (!user) continue;
            const messageIndex = user.submittedForReview.indexOf(reviewMessage);
            if (messageIndex !== -1) {
                user.submittedForReview.splice(messageIndex, 1);
                if (message.category === 2) user.fouls = Math.max(0, user.fouls - 1);
                if (user.fouls < 10) user.blocked = false;
                await user.save();
            }
        }
        res.status(200).json({ message: "Review completed successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch update." });
    }
});

module.exports = {
    registerUser,
    verifyEmail,
    authUser,
    allUsers,
    updateProfilePicture,
    submitForReview,
    fetchSubmitForReview,
    review,
    logoutUser,
    resendVerificationEmail,
};
