const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Message = require('../models/messageModel');
const User = require("../models/userModel");
const { encryptMessage, decryptMessage } = require("../utils/messageCrypto");
const { replyAsAssistant } = require("../services/aiAssistantService");
const { moderateContent } = require("../services/moderationService");

const sendMessage = asyncHandler(async (req, res) => {
    const { content, media, chatId, messageId } = req.body;
    if ((!content && !media) || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }
    if (content && (typeof content !== "string" || content.length > 10_000)) {
        return res.status(400).json({ error: "Message content is too long" });
    }
    if (media) {
        try {
            if (new URL(media).protocol !== "https:" || media.length > 2048) throw new Error();
        } catch {
            return res.status(400).json({ error: "Invalid media URL" });
        }
    }

    let encryptedContent, encryptedMedia;
    if (content) encryptedContent = encryptMessage(content);
    if (media) encryptedMedia = encryptMessage(media);

    var newMessage = {
        sender: req.user._id,
        content: encryptedContent,
        media: encryptedMedia,
        isReplyTo: messageId ? messageId : undefined,
        chat: chatId,
    };

    try {
        const chat = await Chat.findOne({ _id: chatId, users: req.user._id });
        if (!chat) return res.status(403).json({ error: "You are not a member of this chat" });
        if (messageId && !await Message.exists({ _id: messageId, chat: chatId })) {
            return res.status(400).json({ error: "Reply message does not belong to this chat" });
        }
        let moderationCategory = "Neither";
        try {
            moderationCategory = await moderateContent(content);
        } catch (error) {
            console.error(`Moderation unavailable: ${error.message}`);
        }
        if (moderationCategory !== "Neither") {
            const moderatedUser = await User.findById(req.user._id);
            moderatedUser.fouls += 1;
            if (moderatedUser.fouls >= 10) moderatedUser.blocked = true;
            await moderatedUser.save();
        }
        res.setHeader("X-Moderation-Category", moderationCategory);
        var message = await Message.create(newMessage);

        let decryptedContent, decryptedMedia;
        if (message.content) decryptedContent = decryptMessage(message.content);
        if (message.media) decryptedMedia = decryptMessage(message.media);
        message.content = decryptedContent;
        message.media = decryptedMedia;

        message = await message.populate("sender", "name pic email isBot");
        message = await message.populate("isReplyTo");
        message = await message.populate("isReplyTo.sender", "name pic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email isBot",
        });

        if (message.isReplyTo) {
            const replyMsg = message.isReplyTo.toObject();
            if (replyMsg.content) replyMsg.content = decryptMessage(replyMsg.content);
            if (replyMsg.media) replyMsg.media = decryptMessage(replyMsg.media);
            message.isReplyTo = replyMsg;
        }

        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message,
        });

        const io = req.app.get("io");
        message.chat.users.forEach(user => {
            if (String(user._id) !== String(req.user._id)) {
                io.to(String(user._id)).emit("message received", message);
            }
        });

        res.status(201).json(message);

        if (!chat.isGroupChat) {
            setImmediate(() => replyAsAssistant({
                chatId,
                senderId: req.user._id,
                io,
            }).catch(error => console.error(`AI assistant reply failed: ${error.message}`)));
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: "Message creation failed" });
    }
});

const allMessages = asyncHandler(async (req, res) => {
    try {
        const chat = await Chat.exists({ _id: req.params.chatId, users: req.user._id });
        if (!chat) return res.status(403).json({ message: "You are not a member of this chat" });
        let messages = await Message.find({ chat: req.params.chatId }).populate("sender", "name pic email isBot").populate("chat").populate("isReplyTo");
        // Decrypt the content of each message before sending the response
        const decryptedMessages = messages.map(message => {

            let decryptedContent, decryptedMedia;
            if (message.content) decryptedContent = decryptMessage(message.content);
            if (message.media) decryptedMedia = decryptMessage(message.media);
            if (message.isReplyTo) {
                const replyMessage = message.isReplyTo.toObject();
                if (replyMessage.content)
                    replyMessage.content = decryptMessage(replyMessage.content);
                if (replyMessage.media)
                    replyMessage.media = decryptMessage(replyMessage.media);
                message.isReplyTo = replyMessage;
            }
            message.content = decryptedContent;
            message.media = decryptedMedia;
            return message;
        });

        res.json(decryptedMessages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const deleteMessage = asyncHandler(async (req, res) => {
    try {
        const message = await Message.findOneAndDelete({
            _id: req.params.messageId,
            sender: req.user._id,
        });
        if (!message) {
            return res.status(404).json({ success: false });
        }
        let newLatestMessageId;
        const messages = await Message.find({ chat: message.chat }).sort({ createdAt: -1 });
        if (messages.length > 0) {
            newLatestMessageId = messages[0]._id;
        }
        // Update the chat's latestMessage property
        const latestMessageUpdate = newLatestMessageId
            ? { $set: { latestMessage: newLatestMessageId } }
            : { $unset: { latestMessage: 1 } };
        const chat = await Chat.findOneAndUpdate(
            { _id: message.chat },
            latestMessageUpdate,
            { new: true }
        ).populate({
            path: 'users',
            select: 'name pic email'
        }).populate({
            path: 'latestMessage',
            select: 'sender content media createdAt',
            populate: {
                path: 'sender',
                select: 'name pic email'
            }
        });
        if (messages.length > 0) {
            let latestMessage = chat.latestMessage.toObject();
            let decryptedContent, decryptedMedia;
            if (latestMessage.content) decryptedContent = decryptMessage(latestMessage.content);
            if (latestMessage.media) decryptedMedia = decryptMessage(latestMessage.media);
            chat.latestMessage.content = decryptedContent;
            chat.latestMessage.media = decryptedMedia;
        }

        const io = req.app.get("io");
        chat.users.forEach(user => {
            if (String(user._id) !== String(req.user._id)) {
                io.to(String(user._id)).emit("new latest message", chat, message);
            }
        });

        res.json({ success: true, chat });
    } catch (err) {
        res.status(400);
        throw new Error(err.message);
    }
});

module.exports = { sendMessage, allMessages, deleteMessage };
