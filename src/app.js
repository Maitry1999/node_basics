// const express = require('express');
// const cors = require('cors');
// const setupSwagger = require('./swagger/swagger');  // Import Swagger setup
// const userRoutes = require('./routes/userRoutes');  // User routes
// const productRoutes = require('./routes/productRoutes');  // Product routes
// require('dotenv').config();  // Load environment variables
// const connectDB = require('./config/db');  // Database connection setup
// const app = express();

// // Middleware to enable CORS and parse JSON bodies
// app.use(cors());
// app.use(express.json());

// // Connect to the database
// connectDB();

// // Setup Swagger UI for API documentation
// setupSwagger(app);

// // Route definitions
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/products', productRoutes);

// // Default 404 error handler for unhandled routes
// app.use((req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// // Start the server
// const port = process.env.PORT || 3500;
// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });

// module.exports = app;


const express = require('express');
const cors = require('cors');
const setupSwagger = require('./swagger/swagger');  // Import Swagger setup
const userRoutes = require('./routes/userRoutes');  // User routes
const productRoutes = require('./routes/productRoutes');  // Product routes
require('dotenv').config();  // Load environment variables
const connectDB = require('./config/db');  // Database connection setup

// Initialize Express app
const app = express();

// Middleware to enable CORS and parse JSON bodies
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
app.use(express.json());

// Connect to the database
connectDB();

// Setup Swagger UI for API documentation
setupSwagger(app);

// Route definitions
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);

// Default 404 error handler for unhandled routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
const port = process.env.PORT || 3500;  // Use the port from the environment variables, default to 3500
const host = '0.0.0.0';  // Ensure the server listens on all interfaces

app.listen(port, host, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});

module.exports = app;
