const app = require('./app');
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;
const http = require("http");
const Chat = require("./models/Chat");
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Allow all origins (for development)
        methods: ["GET", "POST"]
    }
});

// Store user socket mappings
const userSocketMap = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Listen for user registration
    socket.on("register-user", (userId) => {
        userSocketMap[userId] = socket.id; // Map user ID to socket ID
        socket.join(userId); // User joins their own room
        console.log(`✅ User ${userId} registered with socket ID: ${socket.id}`);
    });

    // Private chat handling
    socket.on("private-message", async ({ senderId, receiverId, message }) => {
        console.log("📩 Private message received:", { senderId, receiverId, message });

        // Save message to DB
        const chatMessage = new Chat({ senderId, receiverId, message });
        await chatMessage.save();

        // Send message to the receiver's socket room
        io.to(receiverId).emit("private-message", { senderId, message });

        // Also send confirmation to sender
        io.to(senderId).emit("private-message", { senderId, message });
    });

    // Join a group
    socket.on("join-group", (groupId) => {
        socket.join(groupId);
        console.log(`User joined group: ${groupId}`);
    });

    // Group chat
    socket.on("group-message", async ({ senderId, groupId, message }) => {
        const chatMessage = new Chat({ senderId, groupId, message });
        await chatMessage.save();
        io.to(groupId).emit("group-message", { senderId, message });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        for (const userId in userSocketMap) {
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId]; // Remove user from the map
                console.log(`❌ User ${userId} disconnected`);
                break;
            }
        }
    });
});

server.listen(4545, () => {
    console.log("🚀 Socket.io server running on http://localhost:4545");
});
