const express = require("express");
const {
    getChats,
    getGroupChats,

} = require("../controllers/chatController");
const { verifyToken } = require("../config/jwt");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       required:
 *         - senderId
 *         - receiverId
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique ID of the message.
 *         senderId:
 *           type: string
 *           description: User ID of the sender.
 *         receiverId:
 *           type: string
 *           description: User ID of the receiver (for private chat).
 *         groupId:
 *           type: string
 *           nullable: true
 *           description: Group ID (for group chat).
 *         message:
 *           type: string
 *           description: The chat message content.
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the message was sent.
 *       example:
 *         _id: "65a12345b67890c123456def"
 *         senderId: "65123456789abcdef1234567"
 *         receiverId: "65123456789abcdef1234568"
 *         message: "Hey, how's it going?"
 *         timestamp: "2024-02-10T12:34:56Z"
 */

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat management APIs (Private and Group chats)
 */

/**
 * @swagger
 * /chats/private/{user1}/{user2}:
 *   get:
 *     summary: Get private chat messages
 *     tags: [Chat]
 *     description: Retrieve all messages in a private chat between two users.
 *     parameters:
 *       - in: path
 *         name: user1
 *         required: true
 *         description: The ID of the first user in the private chat.
 *         schema:
 *           type: string
 *       - in: path 
 *         name: user2  
 *         required: true
 *         description: The ID of the second user in the private chat.  
 *         schema:
 *           type: string
 *     security:     
 *       - bearerAuth: []
 *     responses:     
 *       200:
 *         description: List of private chat messages.
 *         content:
 *           application/json:  
 *             schema:  
 *               type: array  
 *               items:  
 *                 $ref: '#/components/schemas/ChatMessage'
 *       401:
 *         description: Unauthorized (Invalid or missing token).
 *       500:     
 *         description: Internal Server Error.
 */
router.get("/private/:user1/:user2", getChats);

/**
 * @swagger
 * /chats/group/{groupId}:
 *   get:
 *     summary: Get group chat messages
 *     tags: [Chat]
 *     description: Retrieve all messages in a specified group chat.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         description: The ID of the group chat.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of group chat messages.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *       401:
 *         description: Unauthorized (Invalid or missing token).
 *       500:
 *         description: Internal Server Error.
 */
router.get("/group/:groupId", verifyToken, getGroupChats);


module.exports = router;
