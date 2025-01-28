const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtKey = process.env.JWT_SECRET;

const signToken = (payload) => jwt.sign(payload, jwtKey,);



const verifyToken = async (req, res, next) => {
    // Extract the 'Authorization' header from the request
    const authHeader = req.headers['authorization'];

    // If the 'Authorization' header is missing, return an error
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing' });
    }

    // Extract the token from the 'Authorization' header (expected format: 'Bearer <token>')
    const token = authHeader.split(' ')[1];

    try {
        // Decode the token using jwt.verify
        const decoded = jwt.verify(token, jwtKey);

        // Find the user by the decoded user ID
        const user = await User.findById(decoded.id);

        // Check if the token exists in the user's tokens array
        if (!user || !user.tokens.includes(token)) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Attach the decoded user data to the request object for further use
        req.user = decoded;

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        // If there's any error (invalid token, expired token, etc.), return an error
        console.error(err);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};



module.exports = { signToken, verifyToken };
