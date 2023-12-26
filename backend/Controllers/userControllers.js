const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs').promises;

dotenv.config();

const myEmailId = process.env.EMAIL_ID;
const emailPW = process.env.PASSWORD;

const generateVerificationToken = () => {
    const length = 10;
    const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }
    return token;
};

const sendVerificationEmail = async (email, verificationToken) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: myEmailId,
            pass: emailPW,
        },
    });

    try {
        const __dirname1 = path.resolve();
        const templatePath = path.join(__dirname1, 'backend', 'templates', 'send-verification-email-success.html');
        const emailTemplate = await fs.readFile(templatePath, 'utf8');
        const html = emailTemplate.replace('{{verificationToken}}', verificationToken);

        const mailOptions = {
            from: myEmailId,
            to: email,
            subject: 'Email Verification',
            html
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please Enter all the fields");
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const verificationToken = generateVerificationToken();

    const isEmailSent = await sendVerificationEmail(email, verificationToken);

    if (isEmailSent) {
        const user = await User.create({
            name,
            email,
            password,
            pic,
            verificationToken,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                isEmailVerified: user.isEmailVerified,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error("Failed to create the user");
        }
    } else {
        res.status(500);
        throw new Error("Failed to send verification email");
    }
});

const verifyEmail = asyncHandler(async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            res.status(404).json({ error: "Invalid verification token" });
            return;
        }

        user.isEmailVerified = true;
        await user.save();

        const __dirname1 = path.resolve();
        const successHtml = await fs.readFile(path.join(__dirname1, 'backend', 'templates', 'verification-success.html'), 'utf8');
        const failureHtml = await fs.readFile(path.join(__dirname1, 'backend', 'templates', 'verification-failure.html'), 'utf8');

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

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.isEmailVerified) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                isEmailVerified: user.isEmailVerified,
                token: generateToken(user._id),
                blocked: user.blocked,
                isAdmin: user.isAdmin,
            });
        } else {
            throw new Error("Please verify your email first");
        }
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
});

const allUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search
        ? {
              $or: [
                  { name: { $regex: req.query.search, $options: "i" } },
                  { email: { $regex: req.query.search, $options: "i" } },
              ],
          }
        : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
});

const updateProfilePicture = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.body.id,
            { pic: req.body.pic },
            { new: true }
        );
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id),
        });
    } catch (err) {
        res.status(500).json({ id: req.body.id, error: err.message });
    }
});

const foulsIncrease = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.blocked) {
            return res.status(400).json({ error: "User is already blocked" });
        }

        user.fouls += 1;
        if (user.fouls >= 10) {
            user.blocked = true;
        }

        await user.save();

        res.status(200).json({ message: "Foul increased by 1" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

const submitForReview = asyncHandler(async (req, res) => {
    const { foulMessage } = req.body;
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.submittedForReview.push(foulMessage);

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
        const users = await User.find({});

        for (const message of messages) {
            const reviewMessage = message.message;
            for (const user of users) {
                const { submittedForReview, fouls } = user;
                const messageIndex = submittedForReview.indexOf(reviewMessage);
                if (messageIndex !== -1) {
                    submittedForReview.splice(messageIndex, 1);
                    user.submittedForReview = submittedForReview;
                    if (message.category === 2)
                        user.fouls = Math.max(0, fouls - 1);
                    if (user.fouls < 10) user.blocked = false;
                    await user.save();
                }
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
    foulsIncrease,
    submitForReview,
    fetchSubmitForReview,
    review,
};
