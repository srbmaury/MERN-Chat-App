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
    const { content, media, chatId } = req.body;

    if ((!content && !media) || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    // Encrypt the message content before saving
    const encryptedContent = encryptMessage(content);
    const encryptedMedia = encryptMessage(media);

    var newMessage = {
        sender: req.user._id,
        content: encryptedContent,
        media: encryptedMedia,
        chat: chatId
    };

    try {
        var message = await Message.create(newMessage);

        // Decrypt the message content before sending the response
        const decryptedContent = decryptMessage(message.content);
        const decryptedMedia = decryptMessage(message.media);
        message.content = decryptedContent;
        message.media = decryptedMedia;

        message = await message.populate("sender", "name pic email");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email"
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message
        });

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const allMessages = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId }).populate("sender", "name pic email").populate("chat");

        // Decrypt the content of each message before sending the response
        const decryptedMessages = messages.map(message => {
            const decryptedContent = decryptMessage(message.content);
            const decryptedMedia = decryptMessage(message.media);
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
            select: 'sender content createdAt',
            populate: {
                path: 'sender',
                select: '-password'
            }
        });
        res.json({ success: true, chat });
    } catch (err) {
        res.status(400);
        throw new Error(err.message);
    }
});

module.exports = { sendMessage, allMessages, deleteMessage };
