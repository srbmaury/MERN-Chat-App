const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require('./Routes/userRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const statusRoutes = require('./Routes/statusRoutes');
const otpRoutes = require('./Routes/otpRoutes');
const unsplashRoutes = require('./Routes/unsplashRoutes');
const openAIRoutes = require('./Routes/openAIRoutes');
const googleSheetRoutes = require('./Routes/googleSheetRoutes');
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const cloudinary = require('cloudinary').v2;
const multer = require("multer");
const cors = require("cors");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const User = require("./models/userModel");
const Chat = require("./models/chatModel");
const { protect } = require("./middleware/authMiddleware");
const { rateLimit } = require("./middleware/rateLimiter");
const { parseCookies } = require("./utils/cookies");

const upload = multer({
    dest: path.resolve(__dirname, "../tmp"),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
        callback(allowed.has(file.mimetype) ? null : new Error("Only JPEG, PNG, and WebP images are allowed"), allowed.has(file.mimetype));
    },
});

const app = express();

const requiredEnvironmentVariables = ["MONGO_URI", "JWT_SECRET", "ENCRYPTION_KEY"];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(name => !process.env[name]);
if (missingEnvironmentVariables.length) {
    throw new Error(`Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`);
}

app.disable("x-powered-by");
app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: ws: wss:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
    next();
});

const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:3000,https://mern-chat-app-duplicate.vercel.app")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (req, origin = req.get("origin")) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    try {
        return new URL(origin).host === req.get("host");
    } catch {
        return false;
    }
};

app.use(cors((req, callback) => {
    const origin = req.get("origin");
    const allowed = isAllowedOrigin(req, origin);
    callback(null, {
        origin: allowed ? (origin || false) : false,
        methods: ["POST", "GET", "PUT", "DELETE"],
        exposedHeaders: ["X-Moderation-Category", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
        credentials: true
    });
}));

app.use((req, res, next) => {
    const origin = req.get("origin");
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (isMutation && !isAllowedOrigin(req, origin)) {
        return res.status(403).json({ message: "Origin is not allowed" });
    }
    next();
});

app.use(express.json({ limit: "1mb" }));

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/unsplash', unsplashRoutes);
app.use('/api/openai', openAIRoutes);
app.use('/api/googlesheet', googleSheetRoutes);

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

app.post('/api/upload', protect, rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }), upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please select an image!' });
    }

    try {
        const uploadOptions = {
            resource_type: 'image',
            folder: 'uploads',
            use_filename: false,
            unique_filename: true,
            upload_preset: process.env.UPLOAD_PRESET
        };

        const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
        res.json({ url: result.secure_url });
    } catch (error) {
        next(error);
    } finally {
        await fs.unlink(req.file.path).catch(() => {});
    }
});

// Serve the built SPA whenever it exists. This keeps client-side routes such
// as /chats refreshable even when the hosting platform does not set NODE_ENV.
const frontendDist = path.resolve(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDist, "index.html"), error => {
        if (error) next();
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = require("http").createServer(app);
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
app.set("io", io);

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || parseCookies(socket.request.headers.cookie).authToken;
        if (!token) return next(new Error("Authentication required"));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id name blocked");
        if (!user || user.blocked) return next(new Error("Authentication failed"));
        socket.userId = String(user._id);
        socket.userName = user.name;
        next();
    } catch {
        next(new Error("Authentication failed"));
    }
});

io.on("connection", (socket) => {
    socket.join(socket.userId);

    socket.on('setup', () => {
        socket.emit("connected");
    });

    const authorizedChat = async (chatOrId) => {
        const chatId = typeof chatOrId === "string" ? chatOrId : chatOrId?._id;
        if (!chatId) return null;
        return Chat.findOne({ _id: chatId, users: socket.userId }).select("users");
    };

    const emitToOtherMembers = async (chatOrId, eventName, ...args) => {
        const chat = await authorizedChat(chatOrId);
        if (!chat) return;
        chat.users.forEach(userId => {
            if (String(userId) !== socket.userId) socket.to(String(userId)).emit(eventName, ...args);
        });
    };

    socket.on('join chat', async (room) => {
        const chat = await authorizedChat(room);
        if (chat) socket.join(String(chat._id));
    });

    socket.on('typing', async (room) => {
        if (await authorizedChat(room)) socket.to(String(room)).emit('typing');
    });
    socket.on('stop typing', async (room) => {
        if (await authorizedChat(room)) socket.to(String(room)).emit('stop typing');
    });

    socket.on('play request', async (chat, u) => {
        await emitToOtherMembers(chat, 'received play request', chat, { _id: socket.userId, name: socket.userName });
    });

    socket.on('player did not respond', async (chat) => {
        await emitToOtherMembers(chat, 'no response close game');
    });

    socket.on('accept play request', async (chat, u) => {
        await emitToOtherMembers(chat, 'accepted play request', socket.userName);
    });

    socket.on('reject play request', async (chat, u) => {
        await emitToOtherMembers(chat, 'rejected play request', socket.userName);
    });

    socket.on('player moved', async (newBoard, chat, _u, xIsNext) => {
        await emitToOtherMembers(chat, 'your turn', newBoard, xIsNext);
    });

    socket.on("disconnect", () => {
        socket.leave(socket.userId);
    });
});

const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
};

if (require.main === module) {
    startServer().catch(error => {
        console.error(`Failed to start server: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { app, server, startServer };
