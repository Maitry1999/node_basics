const express = require('express');
const cors = require('cors');
const setupSwagger = require('./swagger/swagger');  // Import Swagger setup
const userRoutes = require('./routes/userRoutes');  // User routes
const productRoutes = require('./routes/productRoutes');  // Product routes
require('dotenv').config();  // Load environment variables
const connectDB = require('./config/db');  // Database connection setup
const path = require('path');
const { log } = require('console');

// Initialize Express app
const app = express();

// Set global base URL (modify according to your environment)
const BASE_URL = process.env.BASE_URL || `http://localhost:3500`;
app.locals.baseUrl = BASE_URL;  // Store globally in app.locals

// Middleware to enable CORS and parse JSON bodies
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views')); // Set the path to the views directory
app.use(express.json());


// Serve static files from the new uploads folder
app.use('/uploads/profile_images', express.static(path.join(__dirname, 'file_upload/profile_images')));

// Connect to the database
connectDB();

// Setup Swagger UI for API documentation
setupSwagger(app);

// Middleware to attach baseUrl to every request (optional)
app.use((req, res, next) => {
    req.baseUrl = BASE_URL;
    next();
});

// Route definitions
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);

// Default 404 error handler for unhandled routes
app.use((req, res) => {
    log('Route not found ', req.url);
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
const port = process.env.PORT || 3500;  // Use the port from the environment variables, default to 3500
const host = '0.0.0.0';  // Ensure the server listens on all interfaces

app.listen(port, host, () => {
    console.log(`Server is running on ${BASE_URL}`);
});

module.exports = app;
