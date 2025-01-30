const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: {
        type: Boolean,
        default: false, // Default is false meaning the email is not verified
    },
    profileImage: { type: String },
    tokens: [{ type: String }],
});

module.exports = mongoose.model('User', userSchema);
