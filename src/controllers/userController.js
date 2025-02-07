const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { signToken } = require('../config/jwt');
const User = require('../models/User');
const createResponse = require('../utils/responseUtils');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTP = require('../models/Otp');
const { OAuth2Client } = require('google-auth-library');
const passport = require('../config/passport'); const axios = require('axios');
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



const sendOtpEmail = async (email, otp, isForgotPassword, token) => {
    try {
        // Validate required environment variables
        if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
            throw new Error("SMTP configuration is missing. Check your environment variables.");
        }

        // Configure transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // Use SSL for port 465
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD
            }
        });

        let subject = isForgotPassword ? 'Reset Your Password - OTP Verification' : 'Email Verification - OTP Verification';
        let htmlContent = '';

        if (isForgotPassword && token) {
            // Generate password reset link
            const resetPasswordLink = `${process.env.BASE_URL}/users/reset-password?token=${token}`;

            // HTML template for password reset
            htmlContent = `
                <p>We received a request to reset your password.</p>
                <p>Click the following link to reset your password:</p>
                <p><a href="${resetPasswordLink}" style="color:blue;">Reset Password</a></p>
                <p>The link will expire in 1 hour.</p>
            `;
        } else {
            // HTML template for email verification OTP
            htmlContent = `
                <p>Thank you for registering with our service.</p>
                <p>Your OTP is: <strong style="font-size: 18px; color: red;">${otp}</strong></p>
                <p>This OTP will expire in 5 minutes.</p>
            `;
        }

        const emailSignature = `
            <br>
            <p>Thanks & Regards,</p>
            <p><strong>Mobile Support Team,</strong></p>
            <p><strong>(Netsol IT Solution Pvt. Ltd)</strong></p>
            <p><a href="https://www.netsolitsolution.com" style="color:blue;">www.netsolitsolution.com</a></p>
            <br>
            <table style="border:1px solid #ccc; padding:10px;">
                <tr>
                    <td>
                        <img src="https://img.freepik.com/free-vector/golden-elegant-logo-with-frame_52683-13462.jpg" alt="Netsol Logo" width="100" />
                    </td>
                    <td>
                        <p><strong>Netsol IT Solutions Pvt. Ltd.</strong></p>
                        <p>Address: 212, 5th Floor SNS Interio, Behind CNG Pump,</p>
                        <p>Bhatia Char Rasta, Surat - 395017</p>
                        <p>Phone: +91 (261) 2228535</p>
                        <p>Mobile: +91 85111 50276, +91 99250 48853</p>
                        <p>Email: <a href="mailto:maitry@netsolitsolution.com">maitry@netsolitsolution.com</a></p>
                        <p>Website: <a href="https://netsolitsolution.com" style="color:blue;">https://netsolitsolution.com</a></p>
                    </td>
                </tr>
            </table>
        `;

        // Combine Email Content and Signature
        htmlContent += emailSignature;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: subject,
            html: htmlContent
        };

        // Send email
        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${email}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error.message);
        return false;
    }
};

module.exports = sendOtpEmail;


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
        // Check if email is already registered
        if (await User.findOne({ email })) {
            return res.status(400).json(createResponse('error', 'Email already registered', null));
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare user object
        const userData = { email, password: hashedPassword, isVerified: false };

        // Check if profile image is uploaded
        if (req.file) {
            const profileImagePath = `${req.protocol}://${req.get('host')}/uploads/profile_images/${req.file.filename}`;
            userData.profileImage = profileImagePath;
        }

        // Save user to the database
        const user = new User(userData);
        await user.save();

        // Generate and send OTP for verification
        const otp = await generateAndStoreOtp(email);
        await sendOtpEmail(email, otp, false);

        res.status(201).json(createResponse('success', 'Registration successful. Please verify your email.', sanitizeUser(user)));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error during registration', null, error.message));
    }
};


// Login an existing user
const loginUser = (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            return res.status(500).json(createResponse('error', 'Server error', null, err.message));
        }
        if (!user) {
            return res.status(401).json(createResponse('error', info.message, null));
        }

        try {
            // Check if the user is verified
            if (!user.isVerified) {
                // If not verified, return user data (without token)
                return res.status(400).json(createResponse('error', 'Please verify your email first', { user: sanitizeUser(user) }));
            }

            // Generate JWT token
            const token = signToken({ id: user._id });
            user.tokens.push(token);  // Store the token in user's tokens array
            await user.save();

            // Return user data with the token
            res.status(200).json(createResponse('success', 'Login successful', { user: sanitizeUser(user), token }));
        } catch (error) {
            console.error(error);
            res.status(500).json(createResponse('error', 'Server error', null, error.message));
        }
    })(req, res, next);  // Call passport authenticate manually
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
        if (isForgotPassword) {
            const user = await User.findOne({ email });
            const token = signToken({ id: user._id });
            user.tokens = [token];
            await user.save();
            await sendOtpEmail(email, otp, isForgotPassword, token);

        } else {
            await sendOtpEmail(email, otp, isForgotPassword);
        }


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
        user.tokens = [token];
        await user.save();
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
        req.user.tokens = undefined;
        req.user.password = undefined;

        res.status(200).json(createResponse('success', 'User fetched successfully', req.user));
    } catch (error) {
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};

const logoutUser = async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
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



const verifySocialToken = async (platform, token) => {
    try {
        if (platform === 'google') {
            const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
            return { success: true, data: response.data }; // Contains email, name, picture, etc.
        } else if (platform === 'facebook') {
            const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);
            if (response.data.error) {
                return { success: false, error: 'Your token has expired. Please log in again.' };
            }
            return { success: true, data: response.data }; // Contains id, name, email, picture
        } else {
            return { success: false, error: 'Invalid platform' };
        }
    } catch (error) {
        console.error(`Error verifying ${platform} token:`, error);

        if (error.response) {

            if (error.response.status === 400) {
                return { success: false, error: 'Your token has expired. Please log in again.' };
            } else if (error.response.status === 401) {
                return { success: false, error: 'Unauthorized access. Invalid or expired token.' };
            }
        }
        return { success: false, error: `Error verifying ${platform} token` };
    }
};

const socialLogin = async (req, res) => {
    const { platform } = req.query;
    const { token } = req.body;

    const verificationResult = await verifySocialToken(platform, token);
    if (!verificationResult.success) {
        return res.status(401).json(createResponse('error', verificationResult.error, null)); // 401 for expired token
    }

    const payload = verificationResult.data;
    const { email, name, id } = payload;
    const socialId = platform === 'google' ? payload.sub : id; // Use `sub` for Google, `id` for Facebook

    try {
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            const authToken = signToken({ id: existingUser._id });
            existingUser.tokens = [authToken];
            await existingUser.save();
            return res.status(200).json(createResponse('success', 'User logged in successfully.', { user: sanitizeUser(existingUser), token: authToken }));
        } else {
            const newUser = new User({
                name,
                email,
                socialId,
                socialPlatform: platform,
                profileImage: platform === 'google' ? payload.picture : payload.picture.data.url,
                isVerified: platform === 'google' ? payload.email_verified : true, // Google provides `email_verified`
            });

            const authToken = signToken({ id: newUser._id });
            newUser.tokens = [authToken];
            await newUser.save();
            return res.status(200).json(createResponse('success', 'User registered and logged in successfully.', { user: sanitizeUser(newUser), token: authToken }));
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json(createResponse('error', 'Database error', null));
    }
};



const googleLoginCallback = (req, res, next) => {

    passport.authenticate(
        'google',
        {
            scope: ['profile', 'email'],

        },

    )(req, res, next);
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
    updatePassword,
    socialLogin,
    googleLoginCallback,

};
