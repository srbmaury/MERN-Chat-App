const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Message = require('../models/messageModel');
const User = require("../models/userModel");
const crypto = require('crypto');

// Encryption key (you can generate a secure key using a key generation function)
const encryptionKey = process.env.ENCRYPTION_KEY || "5a2a9a61b7cc2e48b0b631f8d19248dce8fe3067692c26d6add6eb215a72a20f";

function encryptMessage(message) {
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptMessage(encryptedMessage) {
  const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
  let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // Encrypt the message content before saving
  const encryptedContent = encryptMessage(content);

  var newMessage = {
    sender: req.user._id,
    content: encryptedContent,
    chat: chatId
  };

  try {
    var message = await Message.create(newMessage);

    // Decrypt the message content before sending the response
    const decryptedContent = decryptMessage(message.content);
    message.content = decryptedContent;

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
      message.content = decryptedContent;
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
