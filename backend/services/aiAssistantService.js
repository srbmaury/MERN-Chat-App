const crypto = require("crypto");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const { encryptMessage, decryptMessage } = require("../utils/messageCrypto");
const { generateOpenAIResponse } = require("./openAIService");

const BOT_KEY = "default-ai-assistant";
const requestWindows = new Map();

function consumeRequestAllowance(userId) {
    const now = Date.now();
    const max = Math.max(1, Number(process.env.AI_ASSISTANT_RATE_LIMIT_PER_MINUTE) || 10);
    const key = String(userId);
    const recent = (requestWindows.get(key) || []).filter(timestamp => now - timestamp < 60_000);
    if (recent.length >= max) {
        requestWindows.set(key, recent);
        return false;
    }
    recent.push(now);
    requestWindows.set(key, recent);
    return true;
}

async function saveAssistantMessage({ assistant, chatId, senderId, io, content }) {
    let message = await Message.create({
        sender: assistant._id,
        content: encryptMessage(content),
        chat: chatId,
    });
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });
    message = await message.populate("sender", "name pic email isBot");
    message = await message.populate({ path: "chat", populate: { path: "users", select: "name pic email isBot" } });
    message.content = content;
    io.to(String(senderId)).emit("message received", message);
}

async function getOrCreateAssistant() {
    let assistant = await User.findOne({ botKey: BOT_KEY });
    if (assistant) return assistant;

    try {
        assistant = await User.create({
            name: process.env.AI_ASSISTANT_NAME || "Chat AI",
            email: process.env.AI_ASSISTANT_EMAIL || "chat-ai@system.local",
            password: crypto.randomBytes(32).toString("hex"),
            pic: process.env.AI_ASSISTANT_PIC || "https://cdn-icons-png.flaticon.com/512/4712/4712035.png",
            isEmailVerified: true,
            isBot: true,
            botKey: BOT_KEY,
        });
        return assistant;
    } catch (error) {
        if (error?.code === 11000) return User.findOne({ botKey: BOT_KEY });
        throw error;
    }
}

async function ensureAssistantChat(userId) {
    const assistant = await getOrCreateAssistant();
    let chat = await Chat.findOne({
        isGroupChat: false,
        $and: [
            { users: userId },
            { users: assistant._id },
        ],
    });
    if (!chat) {
        chat = await Chat.create({
            chatName: assistant.name,
            isGroupChat: false,
            users: [userId, assistant._id],
        });
    }
    return chat;
}

async function isAssistantChat(chat, senderId) {
    if (!chat || chat.isGroupChat || chat.users.length !== 2) return null;
    const otherId = chat.users.find(id => String(id) !== String(senderId));
    return otherId ? User.findOne({ _id: otherId, isBot: true, botKey: BOT_KEY }) : null;
}

async function replyAsAssistant({ chatId, senderId, io }) {
    const chat = await Chat.findById(chatId).select("users isGroupChat");
    const assistant = await isAssistantChat(chat, senderId);
    if (!assistant) return;

    io.to(String(chatId)).emit("typing");
    try {
        if (!consumeRequestAllowance(senderId)) {
            await saveAssistantMessage({
                assistant,
                chatId,
                senderId,
                io,
                content: "You've reached the AI message limit. Please wait a minute and try again.",
            });
            return;
        }

        const recent = await Message.find({ chat: chatId }).sort({ createdAt: -1 }).limit(12).lean();
        const input = recent.reverse()
            .filter(message => message.content)
            .map(message => ({
                role: String(message.sender) === String(assistant._id) ? "assistant" : "user",
                content: decryptMessage(message.content).slice(0, 2_000),
            }));

        const baseInstructions = process.env.AI_ASSISTANT_INSTRUCTIONS ||
            "You are Chat AI, a helpful assistant inside a chat application. Be accurate, friendly, concise, and clearly say when you are uncertain. Do not claim to have performed actions you cannot perform.";
        const programmingPolicy = process.env.AI_ASSISTANT_ALLOW_PROGRAMMING === "true"
            ? ""
            : "Do not write, generate, debug, translate, or explain programming code. Politely state that programming assistance is outside your scope and offer help with a non-programming topic instead.";
        const reply = await generateOpenAIResponse(
            input,
            `${baseInstructions}\n\n${programmingPolicy}`.trim(),
            600
        );

        await saveAssistantMessage({ assistant, chatId, senderId, io, content: reply });
    } catch (error) {
        console.error(`AI assistant generation failed: ${error.message}`);
        await saveAssistantMessage({
            assistant,
            chatId,
            senderId,
            io,
            content: "I'm temporarily unavailable because the AI service is not configured correctly. Please try again later.",
        });
    } finally {
        io.to(String(chatId)).emit("stop typing");
    }
}

module.exports = { ensureAssistantChat, getOrCreateAssistant, isAssistantChat, replyAsAssistant };
