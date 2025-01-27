const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { signToken, verifyToken } = require('../config/jwt');
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
    const { email, isForgotPassword } = req.body;

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
                user: 'alyson.carter46@ethereal.email',
                pass: 'AUrQcYm3xgCzcjcp8F'
            }
        });

        // Construct the OTP verification URL
        const otpVerificationLink = `${process.env.BASE_URL}/reset-password?email=${email}&otp=${otp}`;

        // Mail options with the OTP verification link
        const mailOptions = {
            from: 'antonette.gibson@ethereal.email',
            to: email,
            subject: 'Reset Your Password - OTP Verification',
            html: `
                <p>We received a request to reset your password.</p>
                <p>Your OTP for resetting the password is <strong>${otp}</strong>.</p>
                <p>This OTP will expire in 5 minutes.</p>
                <p>Click the following link to verify your OTP and reset your password:</p>
                <a href="${otpVerificationLink}">Verify OTP and Reset Password</a>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Render the EJS file if `isForgotPassword` is true
        if (isForgotPassword) {
            return res.render('reset-password', {
                email,
                otp,
                otpVerificationLink,
                message: 'An OTP has been sent to your email address. Please verify to reset your password.'
            });
        } else {
            return res.status(200).json(createResponse('success', 'OTP sent successfully. Please check your email.', null));
        }

        // Send generic success response for email verification
        //  res.status(200).json(createResponse('success', 'OTP sent successfully. Please check your email.', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error while sending OTP.', null, error.message));
    }
};




const verifyOtp = async (req, res) => {
    const { email, otp, isForgotPassword } = req.body;  // Include the flag for forgot password

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json(createResponse('error', 'Email not registered', null));
        }

        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json(createResponse('error', 'Invalid OTP', null));
        }

        const currentTime = new Date().getTime();
        if (otpRecord.expirationTime < currentTime) {
            return res.status(400).json(createResponse('error', 'OTP expired', null));
        }

        // If OTP is valid and this is for forgot password, return a link for resetting password
        if (isForgotPassword) {
            return res.status(200).json(createResponse('success', 'OTP verified successfully. Please enter a new password.', { redirectTo: '/new-password' }));
        }

        // If it's for email verification
        res.status(200).json(createResponse('success', 'OTP verified successfully', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Error verifying OTP', null, error.message));
    }
};



const getUser = async (req, res) => {
    try {
        res.status(200).json(createResponse('success', 'User fetched successfully', req.user));
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
}

const logoutUser = async (req, res) => {
    try {

        res.status(200).json(createResponse('success', 'Logout successful', null));
    } catch (error) {
        console.error('Error logging out user:', error);
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json(createResponse('error', 'All fields are required', null));
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json(createResponse('error', 'Passwords and confirm password do not match', null));
    }

    try {
        const user = await User.findById(req.user.id); // Assuming user data is already in req.user (JWT)

        if (!user) return res.status(404).json(createResponse('error', 'User not found', null));

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) return res.status(400).json(createResponse('error', 'Incorrect old password', null));

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json(createResponse('success', 'Password updated successfully', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error', null, error.message));
    }
};


const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json(createResponse('error', 'Email is required', null));
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json(createResponse('error', 'User not found', null));
        }

        // // Generate OTP
        // const otp = Math.floor(100000 + Math.random() * 900000);

        // // Save OTP to database
        // await OTP.create({ email, otp });

        // Send OTP to user's email
        await sendOtp(req, res);  // Call the sendOtp function here to send the OTP

        //res.status(200).json(createResponse('success', 'OTP sent successfully', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error', null, error.message));
    }
}
const updatePassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id; // Extract userId from the decoded token

    try {
        if (newPassword !== confirmPassword) {
            return res.status(400).json(createResponse('error', 'Passwords do not match', null));
        }

        const user = await User.findById(userId);  // Find the user by ID

        if (!user) {
            return res.status(400).json(createResponse('error', 'User not found', null));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json(createResponse('success', 'Password updated successfully', null));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Error updating password', null, error.message));
    }
};

module.exports = { registerUser, loginUser, sendOtp, verifyOtp, getUser, logoutUser, changePassword, forgotPassword, updatePassword };
