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
    googleId: { type: String },
    facebookId: { type: String },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },


});

module.exports = mongoose.model('User', userSchema);
