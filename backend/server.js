const express = require("express");
const dotenv = require("dotenv");
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
const upload = multer({ dest: 'tmp/' });
const cors = require("cors");
const path = require('path');

dotenv.config();

connectDB();
const app = express();

app.use(cors(
    {
        origin: ["mern-chat-app-duplicate.vercel.app"],
        methods: ["POST", "GET"],
        credentials: true
    }
));

app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/unsplash', unsplashRoutes);
app.use('/api/openai', openAIRoutes);
app.use('/api/googlesheet', googleSheetRoutes);

// -------------------------- DEPLOYMENT---------------------------
const __dirname1 = path.resolve(); 
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname1, "/frontend/build")));
    app.get('*',(req, res)=>{
        res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
    })
}else{
    app.get("/", (req, res) => {
        res.send("API is running successfully");
    });    
}
// -------------------------- DEPLOYMENT---------------------------
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

app.use('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please select an image!' });
    }

    if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png') {
        const uploadOptions = {
            resource_type: 'auto',
            folder: 'uploads',
            use_filename: true,
            upload_preset: process.env.UPLOAD_PRESET
        };

        cloudinary.uploader.upload(req.file.path, uploadOptions, (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Failed to upload image.' });
            }

            res.json({ url: result.secure_url });
        });
    } else {
        return res.status(400).json({ message: 'Please select an image!' });
    }
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`Server started on port ${PORT}`));

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:3000",
    },
});

io.on("connection", (socket) => {
    socket.on('setup', (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log("User joined Room: ", room);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on('new message', (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log('chat.users not defined');

        chat.users.forEach(user => {
            if (user._id === newMessageReceived.sender._id) return;
            socket.in(user._id).emit('message received', newMessageReceived);
        });
    });

    socket.on('new group', (newGroupFormed) => {
        var chat = newGroupFormed;
        if (!chat.users) return console.log('chat.users not defined');

        chat.users.forEach(user => {
            socket.in(user._id).emit('group formed', newGroupFormed);
        });
    });

    socket.on('deleted message', (chat, message) => {
        if (!chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            socket.in(user._id).emit('new latest message', chat, message);
        });
    });

    socket.on('chat deleted', (chat) => {
        if (!chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            socket.in(user._id).emit('remove chat', chat);
        });
    });

    socket.on('play request', (chat, u) => {
        if (!chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            if(user._id === u._id) return;
            socket.in(user._id).emit('received play request', chat, u);
        });
    });

    socket.on('player did not respond', (chat, u) => {
        if (!chat || !chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            if(user._id === u._id) return;
            socket.in(user._id).emit('no response close game');
        });
    });

    socket.on('accept play request', (chat, u) => {
        if (!chat || !chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            if(user._id === u._id) return;
            socket.in(user._id).emit('accepted play request', u.name);
        });
    });

    socket.on('reject play request', (chat, u) => {
        if (!chat || !chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            if(user._id === u._id) return;
            socket.in(user._id).emit('rejected play request', u.name);
        });
    });

    socket.on('player moved', (newBoard, chat, u, xIsNext) => {
        if (!chat || !chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            if(user._id === u._id) return;
            socket.in(user._id).emit('your turn',  newBoard, xIsNext);
        });
    });

    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});