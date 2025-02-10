const createResponse = require('../utils/responseUtils');  // Import the response utility
const Chat = require('../models/Chat');

const getChats = async (req, res) => {
    try {
        const user1 = req.user.id;
        const { user2 } = req.params;

        const chats = await Chat.find({
            $or: [
                { senderId: user1, receiverId: user2 },
                { senderId: user2, receiverId: user1 },
            ],
        }).sort({ timestamp: 1 });

        res.json(createResponse('success', 'Chats fetched successfully', chats));
    } catch (err) {
        res.status(500).json(createResponse('error', 'Internal server error', null, err.message));
    }
};

const getGroupChats = async (req, res) => {
    try {
        const { groupId } = req.params;
        const chats = await Chat.find({ groupId }).sort({ timestamp: 1 });
        res.json(createResponse('success', 'Group chats fetched successfully', chats));
    } catch (err) {
        res.status(500).json(createResponse('error', 'Internal server error', null, err.message));
    }
};

module.exports = {
    getChats,
    getGroupChats
};