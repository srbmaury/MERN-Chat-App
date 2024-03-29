const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Message = require('../models/messageModel');
const User = require("../models/userModel");
const crypto = require('crypto');
const dotenv = require("dotenv");
dotenv.config();

// Encryption key (you can generate a secure key using a key generation function)
const encryptionKey = process.env.ENCRYPTION_KEY;

function encryptMessage(message) {
    const iv = crypto.randomBytes(16); // Generate a new IV for each encryption
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prepend the IV to the encrypted message
    const encryptedMessage = iv.toString('hex') + encrypted;
    return encryptedMessage;
}

function decryptMessage(encryptedMessage) {
    const iv = Buffer.from(encryptedMessage.slice(0, 32), 'hex'); // Extract the IV
    const encrypted = encryptedMessage.slice(32);

    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const sendMessage = asyncHandler(async (req, res) => {
    const { content, media, chatId, messageId } = req.body;
    if ((!content && !media) || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
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
        var message = await Message.create(newMessage);

        let decryptedContent, decryptedMedia;
        if (message.content) decryptedContent = decryptMessage(message.content);
        if (message.media) decryptedMedia = decryptMessage(message.media);
        message.content = decryptedContent;
        message.media = decryptedMedia;

        message = await message.populate("sender", "name pic email");
        message = await message.populate("isReplyTo");
        message = await message.populate("isReplyTo.sender", "name pic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email",
        });

        if (message.isReplyTo) {
            let replyMsg = await Message.findById(message.isReplyTo);
            replyMsg = replyMsg.toObject();
            if (replyMsg.content) replyMsg.content = decryptMessage(replyMsg.content);
            if (replyMsg.media) replyMsg.media = decryptMessage(replyMsg.media);
            message.isReplyTo = replyMsg;
        }

        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message,
        });

        res.status(201).json(message);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: "Message creation failed" });
    }
});

const allMessages = asyncHandler(async (req, res) => {
    try {
        let messages = await Message.find({ chat: req.params.chatId }).populate("sender", "name pic email").populate("chat").populate("isReplyTo");
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
        const message = await Message.findByIdAndDelete(req.params.messageId);
        if (!message) {
            return res.status(404).json({ success: false });
        }
        let newLatestMessageId;
        const messages = await Message.find({ chat: message.chat }).sort({ createdAt: -1 });
        if (messages.length > 0) {
            newLatestMessageId = messages[0]._id;
        }
        // Update the chat's latestMessage property
        const chat = await Chat.findOneAndUpdate(
            { _id: message.chat },
            { latestMessage: newLatestMessageId },
            { new: true }
        ).populate({
            path: 'users',
            select: '-password'
        }).populate({
            path: 'latestMessage',
            select: 'sender content media createdAt',
            populate: {
                path: 'sender',
                select: '-password'
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

        res.json({ success: true, chat });
    } catch (err) {
        res.status(400);
        throw new Error(err.message);
    }
});

module.exports = { sendMessage, allMessages, deleteMessage };
