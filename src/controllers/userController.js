const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { signToken } = require('../config/jwt');
const User = require('../models/User');
const createResponse = require('../utils/responseUtils');  // Import the response utility
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTP = require('../models/Otp'); // Import your OTP model
// Register a new user
const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse('error', 'Validation failed', null, errors.array()));

    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.status(400).json(createResponse('error', 'Email already registered', null));
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await new User({ email, password: hashedPassword, isVerified: false }).save(); // Set isVerified to false initially

        // Send OTP to verify email
        await sendOtp(req, res);  // Call the sendOtp function here to send the OTP

        // Remove password field before sending response
        user.password = undefined;

        // Respond with message indicating OTP sent
        res.status(201).json(createResponse('success', 'Registration successful. Please verify your email to complete registration.', null));
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

        // Check if the email is verified
        if (!user.isVerified) {
            return res.status(400).json(createResponse('error', 'Please verify your email first', null));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json(createResponse('error', 'Invalid credentials', null));

        // Remove password field before sending response
        user.password = undefined;

        const token = signToken({ id: user._id });
        res.status(200).json(createResponse('success', 'Login successful', { user, token }));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error', null, error.message));
    }
};

const sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
        const expirationTime = new Date().getTime() + 5 * 60 * 1000; // OTP expires in 5 minutes

        // Attempt to update the existing OTP or create a new one if none exists
        await OTP.findOneAndUpdate(
            { email },  // Find the OTP document by email
            { otp, expirationTime },  // Update the OTP and expiration time
            { upsert: true }  // If no document is found, create a new one
        );

        // Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'celestino.hoeger@ethereal.email',
                pass: '8sHsmkxyQ1h23x7MtK'
            }
        });

        // Mail options
        const mailOptions = {
            from: 'celestino.hoeger@ethereal.email',
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is ${otp}. It will expire in 5 minutes.`,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Send response
        res.status(200).json(createResponse('success', 'OTP sent successfully. Please check your email.', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error while sending OTP.', null, error.message));
    }
};

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Find the user first to check if the email exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json(createResponse('error', 'Email is not registered', null));
        }

        // Find the OTP record from the database
        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json(createResponse('error', 'Invalid OTP', null));
        }

        // Check if OTP is expired
        const currentTime = new Date().getTime();
        if (otpRecord.expirationTime < currentTime) {
            return res.status(400).json(createResponse('error', 'OTP has expired', null));
        }

        // Update user verification status
        await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });

        // Generate token after verification
        const token = signToken({ id: user._id });

        // Remove password from response
        user.password = undefined;

        res.status(200).json(createResponse('success', 'Email verified successfully', { user, token }));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error during OTP verification', null, error.message));
    }
};

module.exports = { registerUser, loginUser, sendOtp, verifyOtp };
