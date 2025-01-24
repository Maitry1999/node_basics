const express = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser, sendOtp, verifyOtp } = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - password_confirmation
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (minimum 8 characters)
 *         password_confirmation:
 *           type: string
 *           format: password
 *           description: Confirmation of user's password
 *       example:
 *         email: user@example.com
 *         password: Password123
 *         password_confirmation: Password123
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (minimum 8 characters)
 *       example:
 *         email: user@example.com
 *         password: Password123
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User authentication and registration APIs
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     description: Allows a new user to register by providing email, password, and password confirmation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Registration success message
 *       400:
 *         description: Validation errors or email already registered
 *       500:
 *         description: Internal server error
 */
router.post('/register', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    check('password_confirmation')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),
], registerUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     description: Allows a user to login by providing email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', loginUser);
/**
 * @swagger
 * /users/send-otp:
 *   post:
 *     summary: Send OTP to the user's email for verification
 *     tags: [Users]
 *     description: Sends a 6-digit OTP to the user's email address for verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *             example:
 *               email: user@example.com
 *     responses:
 *       200:
 *         description: OTP successfully sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Invalid email address
 *       500:
 *         description: Internal server error
 */
router.post('/send-otp', [
    check('email').isEmail().withMessage('Invalid email address'),
], sendOtp);

/**
 * @swagger
 * /users/verify-otp:
 *   post:
 *     summary: Verify OTP for email verification
 *     tags: [Users]
 *     description: Verifies the provided OTP for email verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               otp:
 *                 type: string
 *                 format: numeric
 *                 description: The OTP code sent to the user's email
 *             example:
 *               email: user@example.com
 *               otp: 123456
 *     responses:
 *       200:
 *         description: OTP successfully verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string   
 *                   description: Success message
 *       400:
 *         description: Invalid email address or OTP
 *       500:
 *         description: Internal server error       
 */

router.post('/verify-otp', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('otp').isNumeric().withMessage('OTP must be a numeric value'),
], verifyOtp);

module.exports = router;
