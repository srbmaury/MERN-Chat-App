const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Message = require('../models/messageModel');
const User = require("../models/userModel");

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;
    
    if(!content || !chatId){
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }
    
    var newMessage = {
        sender: req.user._id,
        content: content,
        chat:chatId
    };
    
    try {
        var message = await Message.create(newMessage);
        
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
        res.json(messages);
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
        if(messages.length > 0) {
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
            select: 'sender content',
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