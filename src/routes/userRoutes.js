const express = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/userController');

const router = express.Router();
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secretPassword123
 *                confirm_password:
 *                 type: string
 *                 format: password
 *                 example: secretPassword123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation errors
 *       500:
 *         description: Internal server error
 */
router.post('/register', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], registerUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secretPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', loginUser);

module.exports = router;
