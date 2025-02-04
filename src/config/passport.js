const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
// Google Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Facebook Strategy
const FacebookStrategy = require('passport-facebook').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Import your User model
require('dotenv').config();

// Local Strategy - Email & Password Authentication
passport.use(new LocalStrategy({
    usernameField: 'email', // Specify the field for the username (email)
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
            return done(null, existingUser);
        }

        // Create a new user
        const user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value
        });
        await user.save();
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ facebookId: profile.id });
        if (existingUser) {
            return done(null, existingUser);
        }

        // Create a new user
        const user = new User({
            facebookId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value
        });
        await user.save();
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));


// JWT Strategy - Protecting Routes
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
        const user = await User.findById(payload.id);
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    } catch (error) {
        return done(error, false);
    }
}));

module.exports = passport;
