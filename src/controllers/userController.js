const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { signToken } = require('../config/jwt');
const User = require('../models/User');
const createResponse = require('../utils/responseUtils');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTP = require('../models/Otp');

// ---------------- Utility Functions ---------------- //

// Function to generate and store OTP
const generateAndStoreOtp = async (email) => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expirationTime = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes

    await OTP.findOneAndUpdate(
        { email },
        { otp, expirationTime },
        { upsert: true }
    );

    return otp;
};

// Function to send OTP email
const sendOtpEmail = async (email, otp, isForgotPassword) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: isForgotPassword ? 'Reset Your Password - OTP Verification' : 'Email Verification - OTP Verification',
        html: `
            <p>${isForgotPassword ? 'We received a request to reset your password.' : 'Thank you for registering with our service.'}</p>
            <p>Your OTP is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 5 minutes.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Function to remove sensitive data from user object
const sanitizeUser = (user) => {
    user.password = undefined;
    user.tokens = undefined;
    return user;
};

// ---------------- Authentication Controllers ---------------- //

// Register a new user
const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse('error', 'Validation failed', null, errors.array()));

    const { email, password } = req.body;

    try {
        if (await User.findOne({ email })) {
            return res.status(400).json(createResponse('error', 'Email already registered', null));
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await new User({ email, password: hashedPassword, isVerified: false }).save();


        await user.save();

        const otp = await generateAndStoreOtp(email);
        await sendOtpEmail(email, otp, false);

        res.status(201).json(createResponse('success', 'Registration successful. Please verify your email.', sanitizeUser(user)));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error during registration', null, error.message));
    }
};

// Login an existing user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json(createResponse('error', 'User not found', null));

        // Check if the user is verified
        if (!user.isVerified) {
            // If not verified, only return user data (without token)
            return res.status(400).json(createResponse('error', 'Please verify your email first', { user: sanitizeUser(user) }));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json(createResponse('error', 'Invalid credentials', null));

        // If the user is verified, generate and share token
        const token = signToken({ id: user._id });
        user.tokens.push(token);  // Store the token in user's tokens array
        await user.save();

        // Return user data with the token if verified
        res.status(200).json(createResponse('success', 'Login successful', { user: sanitizeUser(user), token }));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error', null, error.message));
    }
};


// ---------------- OTP Handling ---------------- //

// Send OTP (for email verification or forgot password)
const sendOtp = async (req, res) => {
    const { email, isForgotPassword } = req.body;

    try {
        if (!(await User.findOne({ email }))) {
            return res.status(400).json(createResponse('error', 'Email not registered', null));
        }

        const otp = await generateAndStoreOtp(email);
        await sendOtpEmail(email, otp, isForgotPassword);

        res.status(200).json(createResponse('success', 'OTP sent successfully.', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Error sending OTP', null, error.message));
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    const { email, otp, isForgotPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json(createResponse('error', 'Email not registered', null));

        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) return res.status(400).json(createResponse('error', 'Invalid OTP', null));

        if (otpRecord.expirationTime < Date.now()) {
            return res.status(400).json(createResponse('error', 'OTP expired', null));
        }

        if (!isForgotPassword) {
            user.isVerified = true;
            await user.save();
        }
        const token = signToken({ id: user._id });
        user.tokens = [token];  // Store token in user session
        res.status(200).json(createResponse('success', 'OTP verified successfully.', { user: sanitizeUser(user), token }));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Error verifying OTP', null, error.message));
    }
};

// ---------------- Password Management ---------------- //

// Forgot Password
const forgotPassword = async (req, res) => {
    req.body.isForgotPassword = true;
    await sendOtp(req, res);
};

// Change Password
const changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json(createResponse('error', 'All fields are required', null));
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json(createResponse('error', 'Passwords do not match', null));
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json(createResponse('error', 'User not found', null));

        if (!(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(400).json(createResponse('error', 'Incorrect old password', null));
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.tokens = [];
        await user.save();

        res.status(200).json(createResponse('success', 'Password updated successfully.', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Error updating password', null, error.message));
    }
};

// ---------------- Miscellaneous ---------------- //

const getUser = async (req, res) => {
    try {
        res.status(200).json(createResponse('success', 'User fetched successfully', req.user));
    } catch (error) {
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};

const logoutUser = async (req, res) => {
    try {
        res.status(200).json(createResponse('success', 'Logout successful', null));
    } catch (error) {
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};
const updatePassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id; // Extract userId from the decoded token

    try {
        // Step 1: Validate passwords
        if (newPassword !== confirmPassword) {
            return res.status(400).json(createResponse('error', 'Passwords do not match', null));
        }

        // Step 2: Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json(createResponse('error', 'User not found', null));
        }

        // Step 3: Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Step 4: Remove all tokens from the user’s session
        user.tokens = []; // Assuming `tokens` is an array storing JWT tokens for the user
        await user.save();

        // Step 5: Respond with a success message
        res.status(200).json(createResponse('success', 'Password updated successfully. Please log in again.', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Error updating password', null, error.message));
    }
};

module.exports = {
    registerUser,
    loginUser,
    sendOtp,
    verifyOtp,
    getUser,
    logoutUser,
    changePassword,
    forgotPassword,
    updatePassword
};
