const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../config/generateToken');
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN;
const myEmailId = process.env.EMAIL_ID;

const generateVerificationToken = () => {
    const length = 10;
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }
    return token;
};

const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            "https://developers.google.com/oauthplayground" // Redirect URI
        );

        oAuth2Client.setCredentials({
            refresh_token: refreshToken,
        });

        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: myEmailId,
                clientId,
                clientSecret,
                refreshToken,
                accessToken,
            },
        });

        const emailTemplate = fs.readFileSync("backend/templates/send-verification-email-success.html", "utf8");
        const html = emailTemplate.replace("{{verificationToken}}", verificationToken);

        const mailOptions = {
            from: myEmailId,
            to: email,
            subject: "Email Verification",
            html,
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.log(error);
        throw new Error("Failed to send verification email");
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

    const user = await User.create({
        name,
        email,
        password,
        pic,
        verificationToken,
    });

    if (user) {
        await sendVerificationEmail(email, verificationToken);
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
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
        res.status(404);
        throw new Error("Invalid verification token");
    }

    user.isEmailVerified = true;
    await user.save();

    const successHtml = fs.readFileSync("backend/templates/verification-success.html", "utf8");
    const failureHtml = fs.readFileSync("backend/templates/verification-failure.html", "utf8");

    if (user && user.isEmailVerified) {
        res.send(successHtml);
    } else {
        res.send(failureHtml);
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
                blocked: user.blocked
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
        const user = await User.findByIdAndUpdate(req.body.id, { pic: req.body.pic }, { new: true });
        console.log(user);
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
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.blocked) {
            return res.status(400).json({ error: 'User is already blocked' });
        }

        user.fouls += 1;
        if (user.fouls >= 10) {
            user.blocked = true;
        }

        await user.save();

        res.status(200).json({ message: 'Foul increased by 1'});
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
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

module.exports = { registerUser, verifyEmail, authUser, allUsers, updateProfilePicture, foulsIncrease, submitForReview };