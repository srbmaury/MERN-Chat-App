const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");
const { parseCookies } = require("../utils/cookies");

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        const bearerToken = req.headers.authorization.split(" ")[1];
        if (bearerToken && bearerToken !== "undefined" && bearerToken !== "null") token = bearerToken;
    }
    if (!token) {
        token = parseCookies(req.headers.cookie).authToken;
    }

    if (token) {
        try {
            //decodes token id
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                res.status(401);
                throw new Error("Not authorized, user no longer exists");
            }
            if (req.user.blocked) {
                res.status(403);
                throw new Error("User is blocked. Please contact support.");
            }
            next();
        } catch (error) {
            res.status(401);
            throw new Error("Not authorized, token failed");
        }
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});

module.exports = { protect };
