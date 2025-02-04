const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createResponse = require('../utils/responseUtils');
const jwtKey = process.env.JWT_SECRET;
const passport = require('../config/passport');
const signToken = (payload) => jwt.sign(payload, jwtKey,);


const verifyToken = passport.authenticate('jwt', { session: false });



module.exports = { signToken, verifyToken };
