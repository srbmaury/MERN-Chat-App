const asyncHandler = require("express-async-handler");
const Status = require("../models/statusModel");
const User = require("../models/userModel");
const cron = require('node-cron');

// Create a new status
const createStatus = asyncHandler(async (req, res) => {
    const { text, media } = req.body;

    if (!text || !media) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    try {
        const newStatus = {
            user: req.user._id,
            text,
            media,
        };

        const status = await Status.create(newStatus);

        res.status(201).json(status);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
});

// Get all statuses
const getStatuses = asyncHandler(async (req, res) => {
    try {
        const statuses = await Status.find().populate("user", "name pic email");

        res.json(statuses);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get status by ID
const getStatusById = asyncHandler(async (req, res) => {
    const { statusId } = req.params;

    try {
        const status = await Status.findById(statusId).populate("user", "name pic email");

        if (!status) {
            console.log("Status not found");
            return res.sendStatus(404);
        }

        res.json(status);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a status
const deleteStatus = asyncHandler(async (req, res) => {
    const { statusId } = req.params;

    try {
        const status = await Status.findById(statusId);

        if (!status) {
            console.log("Status not found");
            return res.sendStatus(404);
        }

        await status.remove();

        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const deleteOldStatuses = async () => {
    try {
        const twentyFourHoursAgo = moment().subtract(24, "hours");
        const oldStatuses = await Status.find({ createdAt: { $lt: twentyFourHoursAgo } });

        for (const status of oldStatuses) {
            await status.remove();
        }
        console.log(`${oldStatuses.length} old statuses have been deleted.`);
    } catch (error) {
        console.error("Error deleting old statuses:", error);
    }
};

cron.schedule("0 0 * * *", deleteOldStatuses);
module.exports = { createStatus, getStatuses, getStatusById, deleteStatus };
