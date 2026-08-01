const asyncHandler = require("express-async-handler");
const Chat = require('../models/chatModel');
const User = require("../models/userModel");
const Message = require('../models/messageModel');
const { decryptMessage } = require("../utils/messageCrypto");
const { ensureAssistantChat } = require("../services/aiAssistantService");

const findMemberChat = (chatId, userId) => Chat.findOne({ _id: chatId, users: userId });
const isValidWallpaper = (value) => {
    if (typeof value !== "string" || value.length > 2048) return false;
    if (/^#[0-9a-f]{6}$/i.test(value)) return true;
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
};

const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }
    if (String(userId) === String(req.user._id)) {
        return res.status(400).json({ message: "Cannot create a chat with yourself" });
    }
    if (!await User.exists({ _id: userId })) {
        return res.status(404).json({ message: "User not found" });
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ]
    })
        .populate("users", "name pic email isBot")
        .populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: 'latestMessage.sender',
        select: 'name pic email isBot'
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
                "name pic email"
            );
            res.status(200).send(FullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

const fetchChats = asyncHandler(async (req, res) => {
    try {
        if (process.env.OPENAI_API_KEY) await ensureAssistantChat(req.user._id);
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "name pic email isBot")
            .populate("groupAdmin", "name pic email")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name pic email isBot",
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
    let users;
    try {
        users = JSON.parse(req.body.users);
    } catch {
        return res.status(400).json({ message: "Invalid users list" });
    }

    if (users.length < 2) {
        return res
            .status(400)
            .send("Atleast 2 users are required to form a group chat");
    }

    users = [...new Set(users.map(String).filter(id => id !== String(req.user._id)))];
    if (await User.countDocuments({ _id: { $in: users }, isBot: { $ne: true } }) !== users.length) {
        return res.status(400).json({ message: "One or more users are invalid" });
    }
    users.push(req.user._id);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "name pic email isBot")
            .populate("groupAdmin", "name pic email");

        const io = req.app.get("io");
        fullGroupChat.users.forEach(user => {
            if (String(user._id) !== String(req.user._id)) {
                io.to(String(user._id)).emit("group formed", fullGroupChat);
            }
        });

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findOneAndUpdate(
        { _id: chatId, isGroupChat: true, groupAdmin: req.user._id },
        {
            chatName
        },
        {
            new: true
        }
    )
        .populate("users", "name pic email isBot")
        .populate("groupAdmin", "name pic email");

    if (!updatedChat) {
        res.status(400);
        throw new Error("Chat not found");
    } else {
        res.json(updatedChat);
    }
});

const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;
    if (!await User.exists({ _id: userId })) return res.status(404).json({ message: "User not found" });

    const added = await Chat.findOneAndUpdate(
        { _id: chatId, isGroupChat: true, groupAdmin: req.user._id },
        {
            $addToSet: { users: userId },
        },
        {
            new: true
        }
    )
        .populate("users", "name pic email isBot")
        .populate("groupAdmin", "name pic email");

    if (!added) {
        res.status(400);
        throw new Error("Chat not found");
    } else {
        res.json(added);
    }
});

const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;
    if (String(userId) === String(req.user._id)) {
        return res.status(400).json({ message: "Transfer administration before leaving the group" });
    }

    const removed = await Chat.findOneAndUpdate(
        { _id: chatId, isGroupChat: true, groupAdmin: req.user._id },
        {
            $pull: { users: userId },
        },
        {
            new: true
        }
    )
        .populate("users", "name pic email isBot")
        .populate("groupAdmin", "name pic email");

    if (!removed) {
        res.status(400);
        throw new Error("Chat not found");
    } else {
        res.json(removed);
    }
});

const deleteChat = asyncHandler(async (req, res) => {
    try {
        const chat = await findMemberChat(req.params.chatId, req.user._id);
        if (!chat) return res.status(404).json({ success: false, error: 'Chat not found' });
        if (chat.isGroupChat && String(chat.groupAdmin) !== String(req.user._id)) {
            return res.status(403).json({ success: false, error: 'Only the group admin can delete this chat' });
        }
        const deletedChat = await Chat.findByIdAndDelete(chat._id);
        await Message.deleteMany({ chat: req.params.chatId });
        const io = req.app.get("io");
        chat.users.forEach(userId => {
            if (String(userId) !== String(req.user._id)) io.to(String(userId)).emit("remove chat", chat);
        });
        res.status(200).json({ success: true, data: deletedChat });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

const muteChat = asyncHandler(async (req, res) => {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
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
    const { wallpaperUrl } = req.body;
    if (!isValidWallpaper(wallpaperUrl)) return res.status(400).json({ message: "Invalid wallpaper" });

    try {
        const chat = await findMemberChat(chatId, req.user._id);

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
    if (!isValidWallpaper(wallpaperUrl)) return res.status(400).json({ message: "Invalid wallpaper" });
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
