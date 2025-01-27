const express = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser, sendOtp, verifyOtp, getUser, logoutUser, changePassword, forgotPassword, updatePassword } = require('../controllers/userController');
const { signToken, verifyToken } = require('../config/jwt');
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
 *               isForgotPassword:
 *                 type: boolean
 *                 description: Flag to indicate if the OTP is for password reset
 *             example:
 *               email: user@example.com
 *               isForgotPassword: false
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 */
router.post('/send-otp', verifyToken, [
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
 *               isForgotPassword:
 *                 type: boolean    
 *                 description: Flag to indicate if the OTP is for password reset
 *             example:
 *               email: user@example.com
 *               otp: 123456
 *               isForgotPassword: false
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error       
 */
router.post('/verify-otp', verifyToken, [
    check('email').isEmail().withMessage('Invalid email address'),
    check('otp').isNumeric().withMessage('OTP must be a numeric value'),
], verifyOtp);

/**
 * @swagger
 * /users/get-user:
 *   get:
 *     summary: Get user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/get-user', verifyToken, getUser);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User successfully logged out
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/logout', verifyToken, logoutUser);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change password for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Old password for the user
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password for the user
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirmation of the new password
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Password successfully changed
 *       400:
 *         description: Bad request, new passwords don't match or invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/change-password', verifyToken, changePassword);

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Request password reset for a user
 *     tags: [Users]
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
 *                 description: Email address of the user
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       400:   
 *         description: Bad request, email not found
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Reset password for a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password for the user
 *               confirmPassword:
 *                 type: string 
 *                 format: password
 *                 description: Confirmation of the new password    
 *             required:
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request, invalid input  
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', verifyToken, updatePassword);
// Add this route to handle the GET request for reset-password page
router.get('/reset-password', (req, res) => {
    const { email, otp } = req.query;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Check if OTP is valid for the given email (example logic, adjust as needed)
    OTP.findOne({ email, otp }).then(otpRecord => {
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid OTP or expired OTP' });
        }

        // If OTP is valid, render the reset-password view (EJS)
        return res.render('reset-password', { email, otp });
    }).catch(err => {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    });
});

module.exports = router;
