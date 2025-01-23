const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { signToken } = require('../config/jwt');
const User = require('../models/User');
const createResponse = require('../utils/responseUtils');  // Import the response utility

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
        const user = await new User({ email, password: hashedPassword }).save();

        // Remove password field before sending response
        user.password = undefined;

        const token = signToken({ id: user._id });

        res.status(201).json(createResponse('success', 'User registered successfully', { user, token }));
    } catch (error) {
        console.error(error);
        res.status(500).json(createResponse('error', 'Server error', null, error.message));
    }
};

// Login an existing user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json(createResponse('error', 'User not found', null));

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

module.exports = { registerUser, loginUser };
