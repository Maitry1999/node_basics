const verifyToken = require('../config/jwt').verifyToken;

const conditionalVerifyToken = (req, res, next) => {
    const { isForgotPassword } = req.body;

    if (isForgotPassword) {
        // Skip verifyToken if isForgotPassword is true
        return next();
    }

    // Otherwise, call verifyToken middleware
    verifyToken(req, res, next);
};

module.exports = conditionalVerifyToken;