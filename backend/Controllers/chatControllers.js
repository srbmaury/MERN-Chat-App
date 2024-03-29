const asyncHandler = require("express-async-handler");
const Chat = require('../models/chatModel');
const User = require("../models/userModel");
const Message = require('../models/messageModel');
const crypto = require('crypto');
const dotenv = require("dotenv");

dotenv.config();
// Encryption key (you can generate a secure key using a key generation function)
const encryptionKey = process.env.ENCRYPTION_KEY;

const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ]
    })
        .populate("users", "-password")
        .populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: 'latestMessage.sender',
        select: 'name pic email'
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: ' sender',
            isGroupChat: false,
            users: [req.user._id, userId]
        };

        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password"
            );
            res.status(200).send(FullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

function decryptMessage(encryptedMessage) {
    const iv = Buffer.from(encryptedMessage.slice(0, 32), 'hex'); // Extract the IV
    const encrypted = encryptedMessage.slice(32);

    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const fetchChats = asyncHandler(async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name pic email",
                });
                results.forEach((x) => {
                    if (x.latestMessage) {
                        const latestMessage = x.latestMessage.toObject();
                        if (latestMessage.content)
                            latestMessage.content = decryptMessage(latestMessage.content);
                        if (latestMessage.media)
                            latestMessage.media = decryptMessage(latestMessage.media);
                        x.latestMessage.content = latestMessage.content;
                        x.latestMessage.media = latestMessage.media;
                    }
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all the fields" });
    }
    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res
            .status(400)
            .send("Atleast 2 users are required to form a group chat");
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName
        },
        {
            new: true
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!updatedChat) {
        res.status(400);
        throw new Error("Chat not found");
    } else {
        res.json(updatedChat);
    }
});

const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(chatId,
        {
            $push: { users: userId },
        },
        {
            new: true
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!added) {
        res.status(400);
        throw new Error("Chat not found");
    } else {
        res.json(added);
    }
});

const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(chatId,
        {
            $pull: { users: userId },
        },
        {
            new: true
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!removed) {
        res.status(400);
        throw new Error("Chat not found");
    } else {
        res.json(removed);
    }
});

const deleteChat = asyncHandler(async (req, res) => {
    try {
        const deletedChat = await Chat.findByIdAndDelete(req.params.chatId);
        await Message.deleteMany({ chat: req.params.chatId });
        res.status(200).json({ success: true, data: deletedChat });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

const muteChat = asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
        return next(new ErrorResponse(`Chat not found with id of ${req.params.chatId}`, 404));
    }
    if (chat.mutedUsers.includes(req.user.id)) {
        chat.mutedUsers = chat.mutedUsers.filter(user => user.toString() !== req.user.id);
        await chat.save();
        return res.status(200).json({ success: true, data: chat });
    }
    chat.mutedUsers.push(req.user.id);
    await chat.save();
    res.status(200).json({ success: true, data: chat });
});

const mutedChats = asyncHandler(async (req, res) => {
    const mutedChats = await Chat.find({ mutedUsers: { $in: [req.user._id] } });
    res.status(200).json({
        success: true,
        data: mutedChats
    });
});

const updateWallpaper = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { userId, wallpaperUrl } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const userWallpaperIndex = chat.wallPaper.findIndex(
            (wallpaper) => String(wallpaper.userId) === String(req.user._id)
        );

        if (userWallpaperIndex !== -1) {
            chat.wallPaper[userWallpaperIndex].wallpaperUrl = wallpaperUrl;
        } else {
            chat.wallPaper.push({ userId: req.user._id, wallpaperUrl });
        }

        await chat.save();

        res.json({ message: 'Wallpaper updated successfully', chat });
    } catch (error) {
        console.error('Error updating wallpaper:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const updateWallpaperForAllChats = asyncHandler(async (req, res) => {
    const { wallpaperUrl } = req.body;
    try {
        const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } });

        for (const chat of chats) {
            const userWallpaperIndex = chat.wallPaper.findIndex(
                (wallpaper) => String(wallpaper.userId) === String(req.user._id)
            );

            if (userWallpaperIndex !== -1) {
                chat.wallPaper[userWallpaperIndex].wallpaperUrl = wallpaperUrl;
            } else {
                chat.wallPaper.push({ userId: req.user._id, wallpaperUrl });
            }

            await chat.save();
        }

        res.json({ message: 'Wallpaper updated for all chats successfully' });
    } catch (error) {
        console.error('Error updating wallpaper for all chats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, deleteChat, muteChat, mutedChats, updateWallpaper, updateWallpaperForAllChats };