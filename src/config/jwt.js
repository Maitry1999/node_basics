const jwt = require('jsonwebtoken');
const jwtKey = process.env.JWT_SECRET;

const signToken = (payload) => jwt.sign(payload, jwtKey, { expiresIn: '1h' });

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Authorization header is missing' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, jwtKey, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = decoded;
        next();
    });
};

module.exports = { signToken, verifyToken };
