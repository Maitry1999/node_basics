const app = require('./app');
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;
const http = require("http");
const Chat = require("./models/Chat");
const Group = require("./models/Group");
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Allow all origins (for development)
        methods: ["GET", "POST"]
    }
});

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
// Handle socket connection
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Private chat
    socket.on("private-message", async ({ senderId, receiverId, message }) => {
        const chatMessage = new Chat({ senderId, receiverId, message });
        await chatMessage.save();
        io.to(receiverId).emit("private-message", { senderId, message });
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

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
server.listen(4545, () => {
    console.log("🚀 Socket.io server running on http://localhost:4545");
});